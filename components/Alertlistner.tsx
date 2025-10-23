import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../services/supabase/client'; // Adjust this path to your client

/**
 * This component listens for new rows in the 'alerts' table
 * and triggers a simple in-app pop-up alert.
 * * This version does NOT use push notifications and works in Expo Go.
 */
export default function AlertListener() {
  
  // This is the main effect that listens to Supabase
  useEffect(() => {

    // 1. Define the handler for what to do when an alert comes in
    const handleNewAlert = (payload) => {
      console.log('New alert received!', payload.new);
      
      const { title, message } = payload.new;

      // 2. Show the in-app alert directly
      Alert.alert(
        title,    // The title of the alert
        message,  // The body of the alert
        [
          { text: 'OK' } // The "Dismiss" button
        ]
      );
    };

    // 3. Create the Supabase channel subscription
    const alertChannel = supabase
      .channel('public:alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        handleNewAlert
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime listener subscribed to alerts table.');
        }
        if (err) {
          console.error('Realtime subscription error:', err.message);
        }
      });

    // 4. Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(alertChannel);
    };
  }, []); // The empty array means this effect runs once.

  // This component renders nothing
  return null;
}