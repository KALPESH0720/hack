import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert as RNAlert,
  FlatList,
} from 'react-native';
import uuid from 'react-native-uuid';
import * as LocationExpo from 'expo-location';
import { analyzeSymptoms } from '../../services/ai/geminiService';
import { supabase } from '../../services/supabase/client';
import { AnalysisResult, Location, LogEntry } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import StethoscopeIcon from '../../components/icons/StethoscopeIcon';
import AlertIcon from '../../components/icons/AlertIcon';

const ChatBotScreen: React.FC = () => {
  const [symptoms, setSymptoms] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedData, setLoggedData] = useState<LogEntry[]>([]);
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching logs:', error);
        setError('Could not load analysis log from the database.');
      } else {
        setLoggedData(data as LogEntry[]);
      }
    };

    fetchLogs();
  }, []);

  const getLocation = useCallback(async (): Promise<Location | null> => {
    let { status } = await LocationExpo.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      RNAlert.alert('Permission Denied', 'Permission to access location was denied.');
      return null;
    }

    try {
      const position = await LocationExpo.getCurrentPositionAsync({});
      const loc = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(loc);
      return loc;
    } catch (err) {
      console.warn('Could not get location', err);
      setLocation(null);
      return null;
    }
  }, []);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError('Please enter your symptoms.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const userLocation = await getLocation();
      const result = await analyzeSymptoms(symptoms);
      setAnalysisResult(result);

      const newLog: LogEntry = {
        id: uuid.v4() as string,
       
        symptoms: symptoms,
        disease: result.predictedDisease,
        location: userLocation,
        timestamp: new Date().toISOString(),
      };
      
      const { error: insertError } = await supabase
        .from('symptom_logs')
        .insert(newLog);

      if (insertError) {
        throw new Error(`Failed to save analysis: ${insertError.message}`);
      }
      
      setLoggedData(prevData => [newLog, ...prevData]);

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logRow}>
      <Text style={[styles.logCell, styles.logTimestamp]}>{new Date(item.timestamp).toLocaleString()}</Text>
      <Text style={[styles.logCell, styles.logDisease]}>{item.disease}</Text>
      <Text style={[styles.logCell, styles.logSymptoms]} numberOfLines={2} ellipsizeMode="tail">{item.symptoms}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flexOne}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Symptom Analyzer</Text>
          <Text style={styles.headerSubtitle}>Enter your symptoms below for an AI-powered analysis.</Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.card}>
            <Text style={styles.label}>Describe your symptoms</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g., I have a headache, fever, and a sore throat..."
              placeholderTextColor="#9CA3AF"
              value={symptoms}
              onChangeText={setSymptoms}
              editable={!isLoading}
              multiline
            />
            <TouchableOpacity
              onPress={handleAnalyze}
              disabled={isLoading}
              style={[styles.button, isLoading && styles.buttonDisabled]}
              activeOpacity={0.7}
            >
              {isLoading ? <LoadingSpinner /> : 
                <>
                  <StethoscopeIcon color="#FFFFFF" width={20} height={20} />
                  <Text style={styles.buttonText}>Analyze Symptoms</Text>
                </>
              }
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
            </View>
          )}

          {analysisResult && (
            <View style={[styles.card, styles.marginTop]}>
              <Text style={styles.resultTitle}>Analysis Result</Text>
              <View style={styles.resultSection}>
                <Text style={styles.resultSubtitle}>Predicted Condition</Text>
                <Text style={styles.predictedDisease}>{analysisResult.predictedDisease}</Text>
              </View>
              <View style={styles.resultSection}>
                <Text style={styles.resultSubtitle}>Reasoning</Text>
                <Text style={styles.reasoningText}>{analysisResult.reasoning}</Text>
              </View>
              <View style={styles.disclaimerContainer}>
                <AlertIcon color="#F59E0B" width={24} height={24} style={styles.disclaimerIcon} />
                <View style={styles.disclaimerTextContainer}>
                    <Text style={styles.disclaimerTitle}>Important Disclaimer</Text>
                    <Text style={styles.disclaimerText}>{analysisResult.disclaimer}</Text>
                </View>
              </View>
            </View>
          )}

          {loggedData.length > 0 && (
            <View style={[styles.card, styles.marginTop]}>
                <Text style={styles.resultTitle}>Analysis Log</Text>
                <View style={styles.logHeader}>
                    <Text style={styles.logHeaderCell}>Timestamp</Text>
                    <Text style={styles.logHeaderCell}>Disease</Text>
                    <Text style={styles.logHeaderCell}>Symptoms</Text>
                </View>
                <FlatList
                  data={loggedData}
                  renderItem={renderLogItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false} // The outer ScrollView handles scrolling
                />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  marginTop: {
    marginTop: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    fontWeight: 'bold',
    color: '#B91C1C',
  },
  errorMessage: {
    color: '#B91C1C',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  resultSection: {
    marginBottom: 16,
  },
  resultSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  predictedDisease: {
    fontSize: 22,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  reasoningText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  disclaimerContainer: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24',
    padding: 16,
    borderRadius: 6,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclaimerIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  disclaimerTextContainer: {
    flex: 1,
  },
  disclaimerTitle: {
    fontWeight: 'bold',
    color: '#B45309',
  },
  disclaimerText: {
    color: '#B45309',
  },
  logHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  logHeaderCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  logRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logCell: {
    flex: 1,
    fontSize: 14,
  },
  logTimestamp: {
    color: '#6B7280',
  },
  logDisease: {
    color: '#111827',
    fontWeight: '500',
  },
  logSymptoms: {
    color: '#6B7280',
  }
});

export default ChatBotScreen;
