import React from 'react';
import { ActivityIndicator } from 'react-native';

const LoadingSpinner: React.FC = () => {
  // The button text is white, so a white spinner is appropriate
  return <ActivityIndicator size="small" color="#FFFFFF" />;
};

export default LoadingSpinner;
