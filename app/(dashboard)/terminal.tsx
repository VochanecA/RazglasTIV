import { useState, useEffect } from 'react';
import { Copy, Check, Speaker } from 'lucide-react';

const AirlineTerminal = () => {
  const [terminalStep, setTerminalStep] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const terminalSteps = [
    'Flight BA237 to New York (JFK) now boarding at Gate A12',
    'Lufthansa LH453 from Frankfurt has arrived at Terminal 2',
    'Final call for Emirates EK089 to Dubai at Gate B7',
    'Flight delay: Air France AF226 to Paris delayed by 30 minutes',
    'Singapore Airlines SQ317 is now ready for boarding at Gate C15',
    'Baggage collection for Flight TK784 from Istanbul at Belt 4 🛄',
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setTerminalStep((prev) =>
        prev < terminalSteps.length - 1 ? prev + 1 : prev
      );
    }, 2000); // Increased delay to make announcements more readable

    return () => clearTimeout(timer);
  }, [terminalStep]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terminalSteps.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-sky-600 p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Speaker className="h-6 w-6 text-white animate-pulse" />
          <h2 className="text-white font-bold">International Terminal</h2>
        </div>
        <img 
          src="/api/placeholder/50/50" 
          alt="Airport Logo" 
          className="h-8 w-8 rounded-full"
        />
      </div>
      
      <div className="bg-gray-900 text-white font-mono text-sm rounded-b-lg shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <button
              onClick={copyToClipboard}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="space-y-2 border-t border-gray-700 pt-4">
            {terminalSteps.map((step, index) => (
              <div
                key={index}
                className={`${
                  index > terminalStep ? 'opacity-0' : 'opacity-100'
                } transition-opacity duration-300`}
              >
                <span className="text-sky-400">📢</span> {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirlineTerminal;