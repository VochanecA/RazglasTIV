import React, { ReactNode } from 'react';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import DelayCalculator from '@/components/ui/FlightDelayCalculator';

const TimetableLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get today's date
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(undefined, options);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main layout with sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content area (left side) */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Tivat Timetable - Today: 
              <span className="text-orange-500 ml-2">{formattedDate}</span>
            </h1>
          </div>
          
          {/* Page content */}
          <div className="mt-6">{children}</div>
          <NotificationCenter />
        </div>

        {/* Right sidebar */}
        <div className="lg:w-96 xl:w-[28rem] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <DelayCalculator />
        </div>
      </div>
    </div>
  );
};

export default TimetableLayout;