import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../services/supabase/client'; // Adjust path if needed

export default function StatusDisplay() {
  // --- State Variables ---
  const [availableDiseases, setAvailableDiseases] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [availableMedicines, setAvailableMedicines] = useState([]); // Store {id, name}
  const [selectedMedicineId, setSelectedMedicineId] = useState(null); // Store the ID
  const [diseaseCount, setDiseaseCount] = useState(0);
  const [medicineQuantity, setMedicineQuantity] = useState(0);
  const [medicineName, setMedicineName] = useState('Medicine');
  const [loadingInitial, setLoadingInitial] = useState(true); // For initial list loading
  const [loadingData, setLoadingData] = useState(false); // For data refresh on selection change
  const [error, setError] = useState(null);

  // --- Effect 1: Fetch dropdown lists on mount ---
  useEffect(() => {
    async function fetchInitialLists() {
      setLoadingInitial(true);
      setError(null);
      try {
        const [diseaseListResponse, medicineListResponse] = await Promise.all([
          supabase.rpc('get_distinct_diseases'),
          supabase.from('medicines').select('id, name').order('name'), // Fetch medicine names and IDs
        ]);

        // Handle disease list
        if (diseaseListResponse.error) throw new Error(`Disease list error: ${diseaseListResponse.error.message}`);
        if (diseaseListResponse.data && diseaseListResponse.data.length > 0) {
          const diseaseNames = diseaseListResponse.data.map(d => d.distinct_disease);
          setAvailableDiseases(diseaseNames);
          setSelectedDisease(diseaseNames[0]); // Default selection
        } else {
          setAvailableDiseases([]); // Ensure empty array
          // Don't set error yet, maybe medicines load fine
        }

        // Handle medicine list
        if (medicineListResponse.error) throw new Error(`Medicine list error: ${medicineListResponse.error.message}`);
        if (medicineListResponse.data && medicineListResponse.data.length > 0) {
          setAvailableMedicines(medicineListResponse.data); // Store [{id: '...', name: '...'}, ...]
          setSelectedMedicineId(medicineListResponse.data[0].id); // Default selection
        } else {
          setAvailableMedicines([]); // Ensure empty array
          setError('No disease or medicine data found to populate lists.'); // Set error if both fail or medicines fail
        }

      } catch (err) {
        setError(`Error fetching lists: ${err.message}`);
      } finally {
        setLoadingInitial(false); // Initial loading finished
      }
    }
    fetchInitialLists();
  }, []); // Run only once

  // --- Effect 2: Fetch counts based on selected disease AND medicine ---
  useEffect(() => {
    // Only run if both selections are made and initial loading is done
    if (loadingInitial || !selectedDisease || !selectedMedicineId) {
      return;
    }

    async function fetchData() {
      setLoadingData(true); // Use separate loading state for updates
      setError(null);

      // Find the name of the selected medicine from the already fetched list
      const selectedMed = availableMedicines.find(med => med.id === selectedMedicineId);
      setMedicineName(selectedMed?.name || 'Selected Medicine');

      try {
        const [diseaseResponse, inventoryResponse] = await Promise.all([
          // 1. Get count for the SELECTED disease
          supabase
            .from('symptom_logs')
            .select('*', { count: 'exact', head: true })
            .eq('disease', selectedDisease),

          // 2. Get the sum of quantities for the SELECTED medicine
          supabase
            .from('inventory')
            .select('quantity')
            .eq('medicine_id', selectedMedicineId), // Use selected medicine ID!
        ]);

        // --- Handle errors ---
        if (diseaseResponse.error) throw new Error(`Disease count error: ${diseaseResponse.error.message}`);
        if (inventoryResponse.error) throw new Error(`Inventory fetch error: ${inventoryResponse.error.message}`);

        // --- Process results ---
        setDiseaseCount(diseaseResponse.count || 0);
        const totalQuantity = inventoryResponse.data
          ? inventoryResponse.data.reduce((sum, item) => sum + item.quantity, 0)
          : 0;
        setMedicineQuantity(totalQuantity);

      } catch (err) {
        console.error("Fetch error details:", err);
        setError(err.message || 'An unknown error occurred');
      } finally {
        setLoadingData(false); // Stop data loading indicator
      }
    }

    fetchData();
  }, [selectedDisease, selectedMedicineId, loadingInitial, availableMedicines]); // Re-run when selections change or initial load finishes

  // --- Render logic ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Status</Text>

      {/* --- Show initial loading or error --- */}
      {loadingInitial && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}
      {!loadingInitial && error && <Text style={styles.errorText}>Error: {error}</Text>}

      {/* --- Show Pickers and Data only if initial load succeeded --- */}
      {!loadingInitial && !error && (
        <>
          {/* --- Disease Picker --- */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Track Disease:</Text>
            <Picker
              selectedValue={selectedDisease}
              style={styles.picker}
              onValueChange={(itemValue) => {
                if (itemValue) setSelectedDisease(itemValue);
              }}
              prompt="Select a disease"
            >
              {availableDiseases.length > 0 ? (
                availableDiseases.map((disease) => (
                  <Picker.Item key={disease} label={disease} value={disease} />
                ))
              ) : (
                <Picker.Item label="No diseases found" value={null} enabled={false} />
              )}
            </Picker>
          </View>

          {/* --- Medicine Picker --- */}
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Check Medicine:</Text>
            <Picker
              selectedValue={selectedMedicineId}
              style={styles.picker}
              onValueChange={(itemValue) => {
                 if (itemValue) setSelectedMedicineId(itemValue);
              }}
              prompt="Select a medicine"
            >
              {availableMedicines.length > 0 ? (
                availableMedicines.map((medicine) => (
                  <Picker.Item key={medicine.id} label={medicine.name} value={medicine.id} />
                ))
              ) : (
                <Picker.Item label="No medicines found" value={null} enabled={false} />
              )}
            </Picker>
          </View>

          {/* --- Status Display --- */}
          {loadingData && <ActivityIndicator size="medium" color="#555" style={styles.dataLoader} />}

          {!loadingData && ( // Only show boxes if data isn't actively loading
            <>
              <View style={styles.statusBox}>
                <Text style={styles.label}>{selectedDisease || 'N/A'} Cases (Total)</Text>
                <Text style={styles.value}>{diseaseCount}</Text>
              </View>

              <View style={styles.statusBox}>
                <Text style={styles.label}>{medicineName} Available (Total Qty)</Text>
                <Text style={styles.value}>{medicineQuantity}</Text>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  pickerContainer: {
    width: '90%',
    marginBottom: 15, // Space between pickers
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
     borderWidth: 1,
     borderColor: '#ddd',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: Platform.OS === 'ios' ? -10 : 0,
    marginLeft: Platform.OS === 'ios' ? 10 : 0,
    marginTop: Platform.OS === 'ios' ? 10 : 0,
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 120 : 50,
     marginTop: Platform.OS === 'ios' ? -40 : 0,
  },
  loader: { // Initial loader
      marginTop: 50,
  },
  dataLoader: { // Loader for data updates
      marginVertical: 20, // Space when data reloads
  },
  statusBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    textAlign: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
});