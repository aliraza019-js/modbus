import React from 'react';

interface DooterLogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
}

const DooterLogo: React.FC<DooterLogoProps> = ({ 
  width = 200, 
  height = 80,
  showText = true 
}) => {
  return (
    <img
      src="https://www.ducorr.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.39cffed3.png&w=256&q=75"
      alt="Ducorr Logo"
      width={width}
      height={height}
      style={{ objectFit: 'contain', display: 'block', verticalAlign: 'middle' }}
    />
  );
};

export default DooterLogo;

