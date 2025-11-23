import React, { useState, ReactNode } from 'react';

interface TooltipProps {
  text: string; // Define the type for the text prop
  children: ReactNode; // Define the type for the children prop
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span 
      onMouseEnter={() => setVisible(true)} 
      onMouseLeave={() => setVisible(false)} 
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {children}
      {visible && (
        <div 
          style={{
            position: 'absolute',
            backgroundColor: 'black',
            color: 'white',
            padding: '5px',
            borderRadius: '5px',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
};

export default Tooltip;
