import React from 'react';
import Svg, { Path } from 'react-native-svg';

// FIX: Accept a `style` prop to allow for custom styling of the SVG icon.
const AlertIcon: React.FC<{ color?: string, width?: number, height?: number, style?: any }> = ({ color = "currentColor", width = 24, height = 24, style }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <Path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <Path d="M12 9v4" />
    <Path d="M12 17h.01" />
  </Svg>
);

export default AlertIcon;
