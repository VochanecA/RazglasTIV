export async function fetchFlightData() {
    try {
      // In a real application, this would be an actual API call
      // For now, we're importing the local JSON file
      const data = await import('../data/flights.json');
      return {
        flights: data.flights,
        departures: data.departures,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching flight data:', error);
      throw error;
    }
  }