// app/speech/page.tsx
"use client";

import { type FC } from 'react';
import { useEffect, useState } from 'react';

interface SpeechSettings {
  speed: string;
  sampleRate: string;
  quality: 'draft' | 'low' | 'medium' | 'high' | 'premium';
}

const SpeechPage: FC = () => {
  const [text, setText] = useState("Hello dear passengers, do not leave your baggage unattended at any time you are at the airport.");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<SpeechSettings>({
    speed: '1',
    sampleRate: '16000',
    quality: 'medium'
  });

  const fetchSpeech = async (text: string) => {
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          speed: settings.speed,
          sample_rate: settings.sampleRate,
          quality: settings.quality
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate speech: ${response.statusText}`);
      }

      const data: { audioData?: string; error?: string } = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.audioData) {
        const audioBlob = await fetch(`data:audio/mp3;base64,${data.audioData}`)
          .then(res => res.blob())
          .catch(error => {
            throw new Error('Failed to process audio data');
          });

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsSpeaking(true);
        setErrorMessage(null);
      } else {
        throw new Error('No audio data received');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate speech');
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioUrl && isSpeaking) {
      const audio = new Audio(audioUrl);
      
      const handleError = (e: Event | string) => {
        console.error('Audio error:', e);
        setErrorMessage('Failed to play audio. Please try again.');
        setIsSpeaking(false);
      };

      audio.onerror = handleError;
      audio.onended = () => setIsSpeaking(false);

      audio.play().catch(handleError);

      return () => {
        audio.onerror = null;
        audio.onended = null;
        audio.pause();
      };
    }
  }, [audioUrl, isSpeaking]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsSpeaking(false);
  };

  const handleSettingChange = (setting: keyof SpeechSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSpeak = async () => {
    setErrorMessage(null);
    await fetchSpeech(text);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Text to Speech</h1>
      
      {/* Settings Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Speed
          </label>
          <select
            value={settings.speed}
            onChange={(e) => handleSettingChange('speed', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sample Rate
          </label>
          <select
            value={settings.sampleRate}
            onChange={(e) => handleSettingChange('sampleRate', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="8000">8000 Hz</option>
            <option value="16000">16000 Hz</option>
            <option value="24000">24000 Hz</option>
            <option value="44100">44100 Hz</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality
          </label>
          <select
            value={settings.quality}
            onChange={(e) => handleSettingChange('quality', e.target.value as SpeechSettings['quality'])}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      <textarea
        className="w-full h-32 p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={text}
        onChange={handleChange}
        placeholder="Enter text to convert to speech..."
      />
      
      <button
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        onClick={handleSpeak}
        disabled={isSpeaking || !text.trim()}
      >
        {isSpeaking ? 'Speaking...' : 'Speak Now'}
      </button>
      
      {errorMessage && (
        <p className="mt-3 text-red-500 text-sm">{errorMessage}</p>
      )}
    </div>
  );
};

export default SpeechPage;