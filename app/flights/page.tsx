// app/flights/page.tsx
"use client";

import React from 'react';
import FlightAnnouncements from '@/components/ui/FlightAnnouncements';
import FlightInfo from '@/components/ui/FlightInfo';
import Departures from '@/components/ui/departures';

const FlightsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Flight Information</h1>
      {/* <FlightAnnouncements /> */}
      <Departures />
      <FlightInfo />
    </div>
  );
};

export default FlightsPage;