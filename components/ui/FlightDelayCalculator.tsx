// components/ui/FlightDelayCalculator.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { emergencyAnnouncementAPI } from '@/lib/emergencyAnnouncementAPI';

import { 
  Clock, 
  CalendarClock, 
  ArrowUp, 
  ArrowDown, 
  Plane, 
  AlertCircle, 
  CheckCircle2, 
  Clock3, 
  ChevronRight,
  Award,
  AlertTriangle,
  BarChart3,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Siren,
  AlertOctagon,
  ShieldAlert,
  Search,
  X,
  Play,
  StopCircle,
  Trash2,
  Megaphone,
  Building,
  MapPin,
  Users,
  Package,
  Phone
} from 'lucide-react';

interface Flight {
  Planirano: string;
  Aktuelno: string;
  KompanijaNaziv: string;
  BrojLeta: string;
  Grad: string;
  StatusEN: string;
}

interface FlightDelayStats {
  averageDelay: number;
  totalFlights: number;
  delayedFlights: number;
  onTimeFlights: number;
  earlyFlights: number;
  maxDelay: number;
  maxDelayFlight?: Flight;
}

// Emergency announcement types
interface EmergencyAlert {
  type: 'security' | 'weather' | 'medical' | 'technical' | 'security-breach';
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedAreas?: string[];
}

interface EvacuationProcedure {
  type: 'fire' | 'security' | 'weather' | 'other';
  zones: string[];
  assemblyPoints: string[];
  instructions: string;
}

interface SecurityLevelChange {
  previousLevel: string;
  newLevel: string;
  restrictions: string[];
  message: string;
}

interface LostFoundAnnouncement {
  item: string;
  location: string;
  description: string;
  contactInfo: string;
}

interface ActiveEmergency {
  id: string;
  type: string;
  text: string;
  priority: number;
  isActive: boolean;
  currentRepeats: number;
  maxRepeats: number;
}

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper components
const ArrowRight = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);

const StatusIcon = ({ status, className }: { status: string, className?: string }) => {
  switch (status) {
    case 'Departed':
      return <Plane className={className} />;
    case 'Arrived':
      return <CheckCircle2 className={className} />;
    case 'Boarding':
      return <Clock className={className} />;
    case 'Delayed':
      return <AlertCircle className={className} />;
    default:
      return <Clock3 className={className} />;
  }
};

const FlightDelayCalculator = () => {
  const [flightData, setFlightData] = useState<Flight[]>([]);
  const [stats, setStats] = useState<FlightDelayStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const [activeEmergencies, setActiveEmergencies] = useState<ActiveEmergency[]>([]);
  const [isLoadingEmergencies, setIsLoadingEmergencies] = useState(false);
  
  // Emergency form states
  const [emergencyType, setEmergencyType] = useState<'security' | 'evacuation' | 'security-level' | 'lost-found'>('security');
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [affectedAreas, setAffectedAreas] = useState('');
  const [evacuationZones, setEvacuationZones] = useState('');
  const [assemblyPoints, setAssemblyPoints] = useState('');
  const [previousSecurityLevel, setPreviousSecurityLevel] = useState('Normal');
  const [newSecurityLevel, setNewSecurityLevel] = useState('Heightened');
  const [securityRestrictions, setSecurityRestrictions] = useState('');
  const [lostItem, setLostItem] = useState('');
  const [lostLocation, setLostLocation] = useState('');
  const [lostDescription, setLostDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('Information Desk');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize theme based on user's preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark));
    document.documentElement.classList.toggle('dark', savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  // Load active emergencies when panel opens
  useEffect(() => {
    if (showEmergencyPanel) {
      loadActiveEmergencies();
    }
  }, [showEmergencyPanel]);

  // Load active emergencies
  const loadActiveEmergencies = async () => {
    setIsLoadingEmergencies(true);
    try {
      const result = await emergencyAnnouncementAPI.getActiveEmergencies();
      if (result.success && result.emergencies) {
        setActiveEmergencies(result.emergencies);
      }
    } catch (error) {
      console.error('Failed to load emergencies:', error);
    } finally {
      setIsLoadingEmergencies(false);
    }
  };

  // Calculate delay in minutes between scheduled and actual time
  const calculateDelayMinutes = (scheduled: string, actual: string): number => {
    if (!scheduled || !actual) return 0;
    
    const scheduledHours = parseInt(scheduled.substring(0, 2));
    const scheduledMinutes = parseInt(scheduled.substring(2));
    const actualHours = parseInt(actual.substring(0, 2));
    const actualMinutes = parseInt(actual.substring(2));
    
    const scheduledTotalMinutes = scheduledHours * 60 + scheduledMinutes;
    const actualTotalMinutes = actualHours * 60 + actualMinutes;
    
    return actualTotalMinutes - scheduledTotalMinutes;
  };

  // Format minutes as hours and minutes
  const formatDelay = (minutes: number): string => {
    if (minutes === 0) return '0m';
    
    const sign = minutes < 0 ? '-' : '+';
    const absMinutes = Math.abs(minutes);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    
    let result = sign;
    if (hours > 0) {
      result += `${hours}h`;
      if (mins > 0) {
        result += ` ${mins}m`;
      }
    } else {
      result += `${mins}m`;
    }
    
    return result;
  };

  // Format time from HHMM to HH:MM
  const formatTime = (time: string): string => {
    if (!time || time.length !== 4) return '';
    return `${time.substring(0, 2)}:${time.substring(2)}`;
  };

  // Format the last refreshed time
  const formatLastRefreshed = (date: Date | null): string => {
    if (!date) return 'Never';
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate all statistics from flight data
  const calculateStats = (flights: Flight[]): FlightDelayStats => {
    let totalDelay = 0;
    let maxDelay = 0;
    let maxDelayFlight: Flight | undefined;
    let delayedCount = 0;
    let onTimeCount = 0;
    let earlyCount = 0;

    flights.forEach(flight => {
      const delay = calculateDelayMinutes(flight.Planirano, flight.Aktuelno);
      
      if (delay > 0) {
        delayedCount++;
      } else if (delay < 0) {
        earlyCount++;
      } else {
        onTimeCount++;
      }
      
      totalDelay += delay;
      
      if (delay > maxDelay) {
        maxDelay = delay;
        maxDelayFlight = flight;
      }
    });

    const averageDelay = flights.length ? totalDelay / flights.length : 0;

    return {
      averageDelay,
      totalFlights: flights.length,
      delayedFlights: delayedCount,
      onTimeFlights: onTimeCount,
      earlyFlights: earlyCount,
      maxDelay,
      maxDelayFlight
    };
  };

  // Toggle table expansion
  const toggleTable = () => {
    setIsTableExpanded(!isTableExpanded);
  };

  // Manual refresh function
  const refreshData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchFlights();
    setIsRefreshing(false);
    setLastRefreshed(new Date());
  };

  // Setup auto-refresh
  const setupAutoRefresh = () => {
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }
    
    autoRefreshTimerRef.current = setInterval(() => {
      refreshData();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  };

  // Emergency announcement functions
  const triggerSecurityAlert = async () => {
    if (!emergencyMessage.trim()) {
      alert('Please enter an emergency message');
      return;
    }

    setIsSubmitting(true);
    try {
      const alert: EmergencyAlert = {
        type: 'security',
        level: securityLevel,
        message: emergencyMessage,
        affectedAreas: affectedAreas.split(',').map(area => area.trim()).filter(area => area),
      };

      const result = await emergencyAnnouncementAPI.addSecurityAlert(alert);
      
      if (result.success) {
        // alert('Security alert triggered successfully!');
        setEmergencyMessage('');
        setAffectedAreas('');
        loadActiveEmergencies();
      } else {
        // alert(`Failed to trigger security alert: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to trigger security alert:', error);
      alert('Failed to trigger security alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerEvacuation = async () => {
    if (!emergencyMessage.trim()) {
      alert('Please enter evacuation instructions');
      return;
    }

    if (!evacuationZones.trim()) {
      alert('Please specify zones to evacuate');
      return;
    }

    setIsSubmitting(true);
    try {
      const procedure: EvacuationProcedure = {
        type: 'security',
        zones: evacuationZones.split(',').map(zone => zone.trim()).filter(zone => zone),
        assemblyPoints: assemblyPoints.split(',').map(point => point.trim()).filter(point => point),
        instructions: emergencyMessage,
      };

      const result = await emergencyAnnouncementAPI.addEvacuation(procedure);
      
      if (result.success) {
        alert('Evacuation procedure activated!');
        setEmergencyMessage('');
        setEvacuationZones('');
        setAssemblyPoints('');
        loadActiveEmergencies();
      } else {
        alert(`Failed to trigger evacuation: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to trigger evacuation:', error);
      alert('Failed to trigger evacuation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeSecurityLevel = async () => {
    if (!emergencyMessage.trim()) {
      alert('Please enter a security level change message');
      return;
    }

    setIsSubmitting(true);
    try {
      const change: SecurityLevelChange = {
        previousLevel: previousSecurityLevel,
        newLevel: newSecurityLevel,
        restrictions: securityRestrictions.split(',').map(restriction => restriction.trim()).filter(restriction => restriction),
        message: emergencyMessage,
      };

      const result = await emergencyAnnouncementAPI.addSecurityLevelChange(change);
      
      if (result.success) {
        alert('Security level changed successfully!');
        setEmergencyMessage('');
        setSecurityRestrictions('');
        loadActiveEmergencies();
      } else {
        alert(`Failed to change security level: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to change security level:', error);
      alert('Failed to change security level');
    } finally {
      setIsSubmitting(false);
    }
  };

  const announceLostFound = async () => {
    if (!lostItem.trim() || !lostLocation.trim()) {
      alert('Please enter item name and location');
      return;
    }

    setIsSubmitting(true);
    try {
      const item: LostFoundAnnouncement = {
        item: lostItem,
        location: lostLocation,
        description: lostDescription,
        contactInfo: contactInfo,
      };

      const result = await emergencyAnnouncementAPI.addLostFound(item);
      
      if (result.success) {
        alert('Lost and found announcement created!');
        setLostItem('');
        setLostLocation('');
        setLostDescription('');
        setContactInfo('Information Desk');
        loadActiveEmergencies();
      } else {
        alert(`Failed to create announcement: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to create lost and found announcement:', error);
      alert('Failed to create announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deactivateEmergency = async (id: string) => {
    try {
      const result = await emergencyAnnouncementAPI.deactivateEmergency(id);
      
      if (result.success) {
        alert('Emergency announcement deactivated!');
        loadActiveEmergencies();
      } else {
        alert(`Failed to deactivate: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to deactivate emergency:', error);
      alert('Failed to deactivate emergency');
    }
  };

  const clearAllEmergencies = async () => {
    if (!window.confirm('Are you sure you want to clear all emergency announcements? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await emergencyAnnouncementAPI.clearAllEmergencies();
      
      if (result.success) {
        alert('All emergency announcements cleared!');
        loadActiveEmergencies();
      } else {
        alert(`Failed to clear emergencies: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to clear emergencies:', error);
      alert('Failed to clear emergencies');
    }
  };

  const getEmergencyTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency-alert':
        return <ShieldAlert className="w-4 h-4" />;
      case 'evacuation-procedure':
        return <Siren className="w-4 h-4" />;
      case 'security-level-change':
        return <AlertOctagon className="w-4 h-4" />;
      case 'lost-found':
        return <Package className="w-4 h-4" />;
      default:
        return <Megaphone className="w-4 h-4" />;
    }
  };

  const getEmergencyTypeColor = (type: string) => {
    switch (type) {
      case 'emergency-alert':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'evacuation-procedure':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case 'security-level-change':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'lost-found':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const fetchFlights = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/fetchFlights');
      
      if (!response.ok) {
        throw new Error('Failed to fetch flight data');
      }
      
      const data = await response.json();
      
      // Combine arrivals and departures
      const allFlights = [...data.departures, ...data.arrivals];
      
      // Convert from processed format back to original format
      const convertedFlights = allFlights.map(flight => ({
        Planirano: flight.scheduled_out.replace(':', ''),
        Aktuelno: flight.actual_out.replace(':', ''),
        KompanijaNaziv: flight.KompanijaNaziv,
        BrojLeta: flight.ident,
        Grad: flight.grad,
        StatusEN: flight.status
      })).filter(flight => flight.Planirano && flight.Aktuelno);
      
      // Sort flights by scheduled time
      const sortedFlights = convertedFlights.sort((a, b) => 
        parseInt(a.Planirano) - parseInt(b.Planirano)
      );
      
      setFlightData(sortedFlights);
      setStats(calculateStats(sortedFlights));
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
    
    // Setup auto-refresh when component mounts
    const cleanup = setupAutoRefresh();
    
    // Clean up auto-refresh on unmount
    return cleanup;
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    // Apply theme to document
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const renderEmergencyPanel = () => {
    if (!showEmergencyPanel) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Siren className="w-6 h-6 text-red-500 mr-2" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Emergency Announcements System</h2>
              </div>
              <button
                onClick={() => setShowEmergencyPanel(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Active Emergencies */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-500" />
                  Active Emergency Announcements
                </h3>
                <button
                  onClick={clearAllEmergencies}
                  disabled={activeEmergencies.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
              
              {isLoadingEmergencies ? (
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-slate-500 dark:text-slate-400">Loading emergencies...</p>
                </div>
              ) : activeEmergencies.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-8 text-center">
                  <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No active emergency announcements</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create a new announcement below</p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-60 overflow-y-auto">
                  {activeEmergencies.map((emergency) => (
                    <div key={emergency.id} className={`border rounded-lg p-4 ${getEmergencyTypeColor(emergency.type)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEmergencyTypeIcon(emergency.type)}
                          <span className="font-semibold capitalize">
                            {emergency.type.replace('-', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            emergency.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}>
                            {emergency.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {emergency.currentRepeats}/{emergency.maxRepeats} repeats
                          </span>
                          <button
                            onClick={() => deactivateEmergency(emergency.id)}
                            disabled={!emergency.isActive}
                            className="p-1 text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            title="Stop announcement"
                          >
                            <StopCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm">{emergency.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Announcement Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Alert */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2 text-red-500" />
                  Security Alert
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Alert Level
                    </label>
                    <select
                      value={securityLevel}
                      onChange={(e) => setSecurityLevel(e.target.value as typeof securityLevel)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    >
                      <option value="low">Low Alert</option>
                      <option value="medium">Medium Alert</option>
                      <option value="high">High Alert</option>
                      <option value="critical">Critical Alert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Affected Areas
                    </label>
                    <input
                      type="text"
                      placeholder="Terminal A, Gate 5, Security Zone..."
                      value={affectedAreas}
                      onChange={(e) => setAffectedAreas(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Alert Message
                    </label>
                    <textarea
                      placeholder="Describe the security situation and instructions..."
                      value={emergencyMessage}
                      onChange={(e) => setEmergencyMessage(e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={triggerSecurityAlert}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Siren className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Triggering...' : 'Trigger Security Alert'}
                  </button>
                </div>
              </div>

              {/* Evacuation Procedure */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
                  <Siren className="w-5 h-5 mr-2 text-orange-500" />
                  Evacuation Procedure
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Zones to Evacuate
                    </label>
                    <input
                      type="text"
                      placeholder="Terminal B, Gates 10-20, Food Court..."
                      value={evacuationZones}
                      onChange={(e) => setEvacuationZones(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Assembly Points
                    </label>
                    <input
                      type="text"
                      placeholder="Parking Lot A, North Exit, Bus Station..."
                      value={assemblyPoints}
                      onChange={(e) => setAssemblyPoints(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Evacuation Instructions
                    </label>
                    <textarea
                      placeholder="Clear instructions for evacuation procedure..."
                      value={emergencyMessage}
                      onChange={(e) => setEmergencyMessage(e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={triggerEvacuation}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Activating...' : 'Activate Evacuation'}
                  </button>
                </div>
              </div>

              {/* Security Level Change */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
                  <AlertOctagon className="w-5 h-5 mr-2 text-blue-500" />
                  Security Level Change
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Previous Level
                      </label>
                      <input
                        type="text"
                        placeholder="Normal"
                        value={previousSecurityLevel}
                        onChange={(e) => setPreviousSecurityLevel(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        New Level
                      </label>
                      <input
                        type="text"
                        placeholder="Heightened"
                        value={newSecurityLevel}
                        onChange={(e) => setNewSecurityLevel(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Security Restrictions
                    </label>
                    <input
                      type="text"
                      placeholder="No large bags, Enhanced screening, ID required..."
                      value={securityRestrictions}
                      onChange={(e) => setSecurityRestrictions(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Change Message
                    </label>
                    <textarea
                      placeholder="Announcement about security level change..."
                      value={emergencyMessage}
                      onChange={(e) => setEmergencyMessage(e.target.value)}
                      rows={2}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={changeSecurityLevel}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Changing...' : 'Change Security Level'}
                  </button>
                </div>
              </div>

              {/* Lost and Found */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-green-500" />
                  Lost and Found
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      placeholder="Black backpack, iPhone, Passport..."
                      value={lostItem}
                      onChange={(e) => setLostItem(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Found Location
                    </label>
                    <input
                      type="text"
                      placeholder="Gate 15, Security Checkpoint, Restroom..."
                      value={lostLocation}
                      onChange={(e) => setLostLocation(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Item Description
                    </label>
                    <textarea
                      placeholder="Detailed description of the item..."
                      value={lostDescription}
                      onChange={(e) => setLostDescription(e.target.value)}
                      rows={2}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Contact Information
                    </label>
                    <input
                      type="text"
                      placeholder="Information Desk, Security Office..."
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={announceLostFound}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Megaphone className="w-4 h-4" />
                    )}
                    {isSubmitting ? 'Announcing...' : 'Announce Lost & Found'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !flightData.length) {
    return (
      <div className="flex items-center justify-center min-h-64 p-6 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 dark:border-blue-400 mb-3"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading flight data...</p>
        </div>
      </div>
    );
  }

  if (error && !flightData.length) {
    return (
      <div className="p-4 dark:bg-gray-900">
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-sm">Error Loading Flight Data</h3>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50 dark:bg-gray-900 rounded-lg transition-colors duration-200">
      {renderEmergencyPanel()}
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white">Flight Delay Analysis & Emergency Control</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Last updated: {formatLastRefreshed(lastRefreshed)}
            </span>
            
            {/* Emergency Control Button */}
            <button 
              onClick={() => setShowEmergencyPanel(true)}
              className="flex items-center px-3 py-1.5 rounded bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400 text-xs font-medium transition-colors duration-150"
            >
              <Siren className="w-3.5 h-3.5 mr-1.5" />
              Emergency Control
            </button>
            
            <button 
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors duration-150"
            >
              <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors duration-150"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Average Delay Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Delay</h3>
                <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
              <p className={`text-2xl font-semibold ${stats.averageDelay > 0 ? 'text-amber-600 dark:text-amber-500' : stats.averageDelay < 0 ? 'text-green-600 dark:text-green-500' : 'text-blue-600 dark:text-blue-500'}`}>
                {formatDelay(Math.round(stats.averageDelay))}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across {stats.totalFlights} flights</p>
            </div>
            
            {/* Flight Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Flight Status</h3>
                <Plane className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Delayed</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{stats.delayedFlights} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({Math.round(stats.delayedFlights / stats.totalFlights * 100)}%)</span></p>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Early</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{stats.earlyFlights} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({Math.round(stats.earlyFlights / stats.totalFlights * 100)}%)</span></p>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">On-Time</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{stats.onTimeFlights} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({Math.round(stats.onTimeFlights / stats.totalFlights * 100)}%)</span></p>
                </div>
              </div>
            </div>
            
            {/* Most Delayed Flight Card */}
            {stats.maxDelayFlight && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 transition-colors duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Most Delayed Flight</h3>
                  <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="flex items-center mb-1">
                  <Award className="w-4 h-4 mr-1 text-amber-500 dark:text-amber-400" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{stats.maxDelayFlight.KompanijaNaziv} {stats.maxDelayFlight.BrojLeta}</p>
                </div>
                <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 mb-1">
                  <ChevronRight className="w-3 h-3 mr-1" />
                  <span>{stats.maxDelayFlight.Grad}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Scheduled</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">{formatTime(stats.maxDelayFlight.Planirano)}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Actual</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">{formatTime(stats.maxDelayFlight.Aktuelno)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Delay</span>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-500">{formatDelay(stats.maxDelay)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual refresh button below cards */}
        <div className="mb-4 flex justify-center space-x-4">
          <button 
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 rounded-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-medium transition-colors duration-150 shadow-sm"
          >
            <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing Data...' : 'Refresh Flight Data'}
          </button>
          
          <button 
            onClick={() => setShowEmergencyPanel(true)}
            className="flex items-center px-4 py-2 rounded-full bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-medium transition-colors duration-150 shadow-sm"
          >
            <Siren className="w-3.5 h-3.5 mr-2" />
            Emergency Control Panel
          </button>
        </div>

        {/* Flight details table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-4 transition-colors duration-200">
          <div 
            className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            onClick={toggleTable}
          >
            <div className="flex items-center">
              <CalendarClock className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                Flight Delay Details 
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  ({flightData.length} flights sorted by scheduled time)
                </span>
              </h2>
            </div>
            <div>
              {isTableExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              )}
            </div>
          </div>
          
          {isTableExpanded && flightData.length > 0 && (
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Airline</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flight</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destination</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduled</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actual</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Delay</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-gray-800">
                  {flightData.map((flight, index) => {
                    const delay = calculateDelayMinutes(flight.Planirano, flight.Aktuelno);
                    let statusIcon;
                    let delayClass;
                    
                    if (delay > 0) {
                      statusIcon = <ArrowUp className="w-3 h-3 text-amber-500 dark:text-amber-400" />;
                      delayClass = 'text-amber-600 dark:text-amber-500';
                    } else if (delay < 0) {
                      statusIcon = <ArrowDown className="w-3 h-3 text-green-500 dark:text-green-400" />;
                      delayClass = 'text-green-600 dark:text-green-500';
                    } else {
                      statusIcon = <Clock3 className="w-3 h-3 text-blue-500 dark:text-blue-400" />;
                      delayClass = 'text-blue-600 dark:text-blue-500';
                    }
                    
                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{flight.KompanijaNaziv}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-slate-800 dark:text-white">{flight.BrojLeta}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{flight.Grad}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{formatTime(flight.Planirano)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{formatTime(flight.Aktuelno)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center">
                            {statusIcon}
                            <span className={`ml-1 ${delayClass}`}>{formatDelay(delay)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                            ${flight.StatusEN === 'Departed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
                              flight.StatusEN === 'Arrived' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                              flight.StatusEN === 'Boarding' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 
                              flight.StatusEN === 'Delayed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                              'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                            <StatusIcon status={flight.StatusEN} className="w-3 h-3 mr-1" />
                            {flight.StatusEN}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {isTableExpanded && flightData.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No flight data available</p>
            </div>
          )}
          
          {!isTableExpanded && (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 bg-opacity-50">
              <ChevronDown className="w-6 h-6 animate-bounce" />
              <p className="text-xs">Click to expand flight details</p>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 mb-4">
          <div className="flex items-center justify-center">
            <RefreshCcw className="w-3 h-3 mr-1.5 text-slate-400 dark:text-slate-500" />
            <span>Data auto-refreshes every 5 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDelayCalculator;