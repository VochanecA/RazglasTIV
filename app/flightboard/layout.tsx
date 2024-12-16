import React, { ReactNode } from 'react';
import { NotificationCenter } from '@/components/ui/NotificationCenter';

const TimetableLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="w-full h-screen bg-white dark:bg-gray-900"> {/* Removed padding */}
      {children}
      <NotificationCenter />
    </div>
  );
};

export default TimetableLayout;