import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import ChatBotScreen from '../screens/ChatBotScreen';
import StatusDisplay from '../components/StatusDisplay'; // Your other component
import AlertListener from '../components/Alertlistner'; 

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Your other app components */}
      <StatusDisplay />

      {/* This component is invisible and listens for alerts */}
      <AlertListener />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Corresponds to bg-gray-50
  },
});

export default App;
