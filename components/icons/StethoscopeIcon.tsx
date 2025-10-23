import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const StethoscopeIcon: React.FC<{ color?: string, width?: number, height?: number }> = ({ color = "currentColor", width = 24, height = 24 }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M4 14a2 2 0 1 0 4 0V6a2 2 0 1 0-4 0" />
    <Path d="M8 6v10a6 6 0 0 0 12 0V6" />
    <Path d="M12 10h0" />
    <Circle cx="20" cy="10" r="2" />
    <Path d="M6 4V2" />
  </Svg>
);

export default StethoscopeIcon;
