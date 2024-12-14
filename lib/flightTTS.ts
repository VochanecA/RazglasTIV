import { useEffect, useState } from 'react';
import { fetchFlightData } from './flightDataFetcher';
import { processAnnouncements } from './announcementQueue';
import { setupBackgroundMusic, fadeOutBackgroundMusic, fadeInBackgroundMusic } from './audioManager';

// Define a type for the TTS engine
export interface TTSEngine {
    initialize: () => void; // Define other methods as needed
}

// Function to get and initialize the TTS engine
export const getFlightTTSEngine = (): TTSEngine => {
    console.log("TTS Engine initialized");
    return {
        initialize() {
            // Initialization logic here
        }
    };
};

// Announcement time logic
export const checkIsAnnouncementTime = () => {
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();

    // Announcement times:
    // April to October (months 3-9): 6am to 8pm
    // November to March (months 10-2): 6am to 3pm
    if (currentMonth >= 3 && currentMonth <= 9) {
        return currentHour >= 6 && currentHour < 20;
    } else {
        return currentHour >= 6 && currentHour < 21;
    }
};

// Hook for fetching flight data 24/7
export const useFlightData = () => {
    const [flights, setFlights] = useState<FlightData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const flightData = await fetchFlightData();
                setFlights(flightData);
            } catch (error) {
                console.error('Error fetching flight data:', error);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 60000); // Fetch every minute

        return () => clearInterval(intervalId);
    }, []);

    return flights;
};

// Hook for managing flight announcements during specified times
export const useFlightAnnouncements = (flights: FlightData | null) => {
    useEffect(() => {
        if (!checkIsAnnouncementTime()) {
            fadeOutBackgroundMusic();
            return;
        }

        const setupAnnouncements = async () => {
            setupBackgroundMusic();

            try {
                if (flights) {
                    await processAnnouncements(flights);
                }
            } catch (error) {
                console.error('Error processing announcements:', error);
            }
        };

        setupAnnouncements();
        const intervalId = setInterval(setupAnnouncements, 60000); // Check every minute

        return () => {
            clearInterval(intervalId);
            fadeInBackgroundMusic(); // Ensure background music is restored
        };
    }, [flights]);
};