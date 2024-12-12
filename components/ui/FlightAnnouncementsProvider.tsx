'use client';

import React from 'react';
import { useFlightAnnouncements } from '@/lib/flightTTS';

export const FlightAnnouncementsProvider: React.FC = () => {
  useFlightAnnouncements();
  return null; // This component doesn't render anything
};