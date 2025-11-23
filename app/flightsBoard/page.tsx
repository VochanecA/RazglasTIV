'use client';

import React from 'react';
import FlightDistributionBoard from '@/components/ui/FlightDistributionBoard';


export default function Page() {
  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-800">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Flight Distribution Board
      </h1>
      <FlightDistributionBoard />

    </div>
  );
}
