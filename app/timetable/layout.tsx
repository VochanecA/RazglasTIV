import React from 'react';

const TimetableLayout: React.FC = ({ children }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* You can add common layout elements here, like a title or navigation */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Tivat Timetable - Today</h1>
      <div className="mt-6">{children}</div> {/* This will render page content */}
    </div>
  );
};

export default TimetableLayout;
