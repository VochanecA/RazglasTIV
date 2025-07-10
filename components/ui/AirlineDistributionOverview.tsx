import { useEffect, useState } from 'react';
import  AirlineDistributionCard  from './AirlineDistributionCard';
import { FlightData } from './FlightScheduleOverview';

export function AirlineDistributionOverview() {
  const [flights, setFlights] = useState<FlightData[]>([]);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const response = await fetch('/api/fetchFlights'); // Adjust the path as needed
        const data = await response.json();

        // Log the API response to verify its structure
        console.log('API Response:', data);

        // Ensure the data is in the expected format
        if (Array.isArray(data)) {
          setFlights(data);
        } else {
          console.error('Unexpected data format:', data);
        }
      } catch (error) {
        console.error('Error fetching flight data:', error);
      }
    };

    // Fetch data initially
    fetchFlights();

    // Set interval to fetch data every 5 minutes (300,000 milliseconds)
    const intervalId = setInterval(fetchFlights, 300000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return <AirlineDistributionCard flights={flights} />;
}
