import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    // Define the path to the JSON file
    const filePath = path.join(process.cwd(), 'app', 'data', 'flights.json');
    
    // Read the JSON file
    const fileData = await fs.readFile(filePath, 'utf8');
    
    // Parse the JSON data
    const flights = JSON.parse(fileData);

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Error reading flight data:', error);
    return NextResponse.json({ error: 'Failed to load flight data' }, { status: 500 });
  }
}


/*  import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Define the URL to fetch the flight data from
    const apiUrl = 'https://example.com/api/flights'; // Replace with your actual API URL
    
    // Fetch the data from the URL
    const response = await fetch(apiUrl);

    // Check if the response is okay (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON data
    const flights = await response.json();

    return NextResponse.json(flights);
  } catch (error) {
    console.error('Error fetching flight data:', error);
    return NextResponse.json({ error: 'Failed to load flight data' }, { status: 500 });
  }
} */
