import React from 'react';

interface ModbusLogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
}

const ModbusLogo: React.FC<ModbusLogoProps> = ({ 
  width = 200, 
  height = 80,
  showText = true 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 80"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Central orange circle */}
      <circle cx="40" cy="40" r="18" fill="#FF6600" />
      
      {/* Six yellow circles arranged around the orange circle */}
      <circle cx="40" cy="15" r="8" fill="#FFD700" />
      <circle cx="58" cy="25" r="8" fill="#FFD700" />
      <circle cx="58" cy="55" r="8" fill="#FFD700" />
      <circle cx="40" cy="65" r="8" fill="#FFD700" />
      <circle cx="22" cy="55" r="8" fill="#FFD700" />
      <circle cx="22" cy="25" r="8" fill="#FFD700" />
      
      {/* Six green arrows radiating from center */}
      <path
        d="M 40 40 L 40 10"
        stroke="#00CC00"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      <path
        d="M 40 40 L 63 20"
        stroke="#00CC00"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      <path
        d="M 40 40 L 63 60"
        stroke="#00CC00"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      <path
        d="M 40 40 L 40 70"
        stroke="#00CC00"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      <path
        d="M 40 40 L 17 60"
        stroke="#00CC00"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      <path
        d="M 40 40 L 17 20"
        stroke="#00CC00"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
      />
      
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#00CC00" />
        </marker>
      </defs>
      
      {/* Modbus text */}
      {showText && (
        <text
          x="70"
          y="50"
          fontFamily="Arial, sans-serif"
          fontSize="32"
          fontWeight="bold"
          fill="#0066CC"
          fontStyle="italic"
          transform="skewX(-10)"
        >
          Modbus
        </text>
      )}
    </svg>
  );
};

export default ModbusLogo;

