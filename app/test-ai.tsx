'use client';

import { useState } from 'react';

export default function TestAIPage() {
  const [text, setText] = useState('Passengers for flight to Paris');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testAI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          flightInfo: {
            type: 'DEP',
            airline: 'AIR FRANCE',
            flightNumber: 'AF456',
            destination: 'Paris',
            origin: 'Belgrade'
          }
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Test AI TTS API</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          cols={50}
          placeholder="Unesite tekst za AI..."
        />
      </div>

      <button 
        onClick={testAI} 
        disabled={loading}
        style={{ padding: '10px 20px', marginBottom: '20px' }}
      >
        {loading ? 'Testiranje...' : 'Testiraj AI'}
      </button>

      {result && (
        <div>
          <h3>Rezultat:</h3>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            whiteSpace: 'pre-wrap'
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}