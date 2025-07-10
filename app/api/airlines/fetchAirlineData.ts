// fetchAirlineCode.ts
export const fetchAirlineCodeByIcao = async (icaoCode: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/airlines/${icaoCode}`); // Adjust this if necessary
  
      if (!response.ok) {
        console.error('Failed to fetch airline data:', response.statusText);
        return null;
      }
  
      const data = await response.json();
  
      if (data.success && data.data) {
        return data.data.code; // Assuming 'code' is the field you want
      } else {
        console.error('Airline not found or error in response:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching airline code:', error);
      return null;
    }
  };
  