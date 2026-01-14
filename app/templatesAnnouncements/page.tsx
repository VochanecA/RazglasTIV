'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trash, 
  Pencil, 
  PlusCircle, 
  Search, 
  Save, 
  XCircle, 
  Plane,
  Download,
  Upload,
  Copy,
  CheckCircle,
  AlertCircle,
  Filter,
  Globe,
  FileText,
  Mic,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Airline {
  id: number;
  name: string;
  fullName: string | null;
  code: string;
  icaoCode: string;
}

interface AnnouncementTemplate {
  id: number;
  airlineId: number;
  type: string;
  language: string;
  template: string;
}

const AnnouncementPage: React.FC = () => {
  const [templates, setTemplates] = useState<AnnouncementTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [newTemplate, setNewTemplate] = useState<{
    id?: number;
    airlineId: number | '';
    type: string;
    language: string;
    template: string;
  }>({
    airlineId: '',
    type: '',
    language: '',
    template: '',
  });
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [newAirline, setNewAirline] = useState<{
    name: string;
    fullName: string;
    code: string;
    icaoCode: string;
  }>({
    name: '',
    fullName: '',
    code: '',
    icaoCode: '',
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [airlineResponse, templateResponse] = await Promise.all([
          fetch('/api/airlines'),
          fetch('/api/announcements')
        ]);

        if (airlineResponse.ok) {
          const airlineData = await airlineResponse.json();
          setAirlines(Array.isArray(airlineData?.data) ? airlineData.data : []);
        } else {
          const errorData = await airlineResponse.json().catch(() => null);
          throw new Error(errorData?.data || airlineResponse.statusText || 'Failed to fetch airlines');
        }

        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          setTemplates(Array.isArray(templateData?.data) ? templateData.data : []);
        } else {
          const errorData = await templateResponse.json().catch(() => null);
          throw new Error(errorData?.data || templateResponse.statusText || 'Failed to fetch templates');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load data. Please try again.');
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({
      ...prev,
      [name]: name === 'airlineId' ? (value ? Number(value) : '') : value
    }));
  };

  const handleAirlineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAirline(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newTemplate.airlineId || !newTemplate.type || !newTemplate.language || !newTemplate.template) {
      setErrorMessage('All template fields are required.');
      return;
    }

    const method = newTemplate.id ? 'PUT' : 'POST';
    const url = newTemplate.id ? `/api/announcements/${newTemplate.id}` : '/api/announcements';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTemplate,
          airlineId: Number(newTemplate.airlineId)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.data || response.statusText || 'Failed to save template.');
      }

      const { data: savedTemplate } = await response.json();

      setTemplates(prev => {
        if (newTemplate.id) {
          return prev.map(template =>
            template.id === newTemplate.id ? savedTemplate : template
          );
        }
        return [savedTemplate, ...prev];
      });

      setSuccessMessage(newTemplate.id ? 'Template updated successfully!' : 'Template created successfully!');
      setNewTemplate({
        airlineId: '',
        type: '',
        language: '',
        template: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save template.');
    }
  };

  const handleEdit = (id: number) => {
    const templateToEdit = templates.find(t => t.id === id);
    if (templateToEdit) {
      setNewTemplate({
        id: templateToEdit.id,
        airlineId: templateToEdit.airlineId,
        type: templateToEdit.type,
        language: templateToEdit.language,
        template: templateToEdit.template,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setNewTemplate({
      airlineId: '',
      type: '',
      language: '',
      template: '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setErrorMessage('');
    
    try {
      const response = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        setSuccessMessage('Template deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.data || response.statusText || 'Failed to delete template.');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete template.');
    }
  };

  const handleAddAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newAirline.name || !newAirline.code || !newAirline.icaoCode) {
      setErrorMessage('Airline Name, Code, and ICAO Code are required.');
      return;
    }

    try {
      const response = await fetch('/api/airlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAirline),
      });

      if (response.ok) {
        const { data: addedAirline } = await response.json();
        setAirlines(prev => [...prev, addedAirline]);
        setNewAirline({
          name: '',
          fullName: '',
          code: '',
          icaoCode: '',
        });
        setSuccessMessage('Airline added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.data || response.statusText || 'Failed to add airline.');
      }
    } catch (error) {
      console.error('Error adding airline:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add airline.');
    }
  };

  const handleCopyTemplate = (template: string, id: number) => {
    navigator.clipboard.writeText(template);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTemplates = templates.filter(template => {
    const airlineName = airlines.find(a => a.id === template.airlineId)?.name || '';
    const matchesSearch = (
      template.template.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airlineName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesFilter = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      cancelled: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      boarding: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      delay: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      arrived: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
      checkin: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      gate_change: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      default: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{templates.length}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-r from-green-500/10 to-blue-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Airlines</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{airlines.length}</p>
            </div>
            <Plane className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 to-pink-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Languages</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {new Set(templates.map(t => t.language)).size}
              </p>
            </div>
            <Globe className="h-8 w-8 text-purple-500 dark:text-purple-400" />
          </div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-r from-orange-500/10 to-red-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Types</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {new Set(templates.map(t => t.type)).size}
              </p>
            </div>
            <Mic className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-red-500/10 to-pink-600/10 backdrop-blur-sm border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <span className="text-red-700 dark:text-red-300">{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="ml-auto">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-green-500/10 to-teal-600/10 backdrop-blur-sm border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
            <span className="text-green-700 dark:text-green-300">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <input
              type="text"
              placeholder="Search templates by text, type, language, or airline..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-sm border border-white/30 dark:border-gray-700/50">
              <Filter className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value="all">All Types</option>
                {Array.from(new Set(templates.map(t => t.type))).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" className="rounded-xl border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" className="rounded-xl border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>

      {/* Create/Edit Template Card */}
      <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white mr-3">
                {newTemplate.id ? <Pencil className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {newTemplate.id ? 'Edit Template' : 'Create New Template'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {newTemplate.id ? 'Update your announcement template' : 'Add a new announcement template'}
                </p>
              </div>
            </div>
            {newTemplate.id && (
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Airline
              </label>
              <select
                name="airlineId"
                value={newTemplate.airlineId}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-300 backdrop-blur-sm appearance-none"
              >
                <option value="" disabled>Select Airline</option>
                {airlines.map(airline => (
                  <option key={airline.id} value={airline.id}>
                    {airline.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                name="type"
                value={newTemplate.type}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-300 backdrop-blur-sm appearance-none"
              >
                <option value="" disabled>Select Type</option>
                <option value="cancelled">Cancelled</option>
                <option value="diverted">Diverted</option>
                <option value="earlier">Earlier</option>
                <option value="arrived">Arrived</option>
                <option value="checkin">Check-in</option>
                <option value="boarding">Boarding</option>
                <option value="close">Close</option>
                <option value="delay">Delay</option>
                <option value="gate_change">Gate Change</option>
                <option value="security">Security</option>
                <option value="assistance">Assistance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <input
                type="text"
                name="language"
                placeholder="EN, SR, RU"
                value={newTemplate.language}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-300 backdrop-blur-sm"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Action
              </label>
              <Button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-[50px]"
              >
                <Save className="h-4 w-4 mr-2" />
                {newTemplate.id ? 'Update Template' : 'Save Template'}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Text
            </label>
            <textarea
              name="template"
              placeholder="Enter announcement template text here..."
              value={newTemplate.template}
              onChange={handleChange}
              required
              className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-all duration-300 backdrop-blur-sm resize-y min-h-[120px]"
              rows={4}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports variables like {`{flight_number}`}, {`{destination}`}, {`{gate}`}
              </p>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {newTemplate.template.length} characters
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Add Airline Card */}
      <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/30 dark:border-gray-700/50">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white mr-3">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add New Airline
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Register a new airline for announcement templates
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddAirline} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Airline Name *
              </label>
              <input
                type="text"
                name="name"
                placeholder="Air Montenegro"
                value={newAirline.name}
                onChange={handleAirlineChange}
                required
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-green-500 dark:focus:border-green-500 transition-all duration-300 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Air Montenegro National Airlines"
                value={newAirline.fullName || ''}
                onChange={handleAirlineChange}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-green-500 dark:focus:border-green-500 transition-all duration-300 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                2-Letter Code *
              </label>
              <input
                type="text"
                name="code"
                placeholder="YM"
                value={newAirline.code}
                onChange={handleAirlineChange}
                required
                maxLength={2}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-green-500 dark:focus:border-green-500 transition-all duration-300 backdrop-blur-sm"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-[50px]"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Airline
              </Button>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ICAO Code *
              </label>
              <input
                type="text"
                name="icaoCode"
                placeholder="MNE"
                value={newAirline.icaoCode}
                onChange={handleAirlineChange}
                required
                maxLength={3}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-green-500 dark:focus:border-green-500 transition-all duration-300 backdrop-blur-sm"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Templates List */}
      <div className="rounded-2xl bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-900/60 backdrop-blur-xl border border-white/30 dark:border-gray-700/50 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-white/30 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Available Templates
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredTemplates.length} templates found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search or create a new template
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map((template) => {
                const airline = airlines.find(a => a.id === template.airlineId);
                return (
                  <div
                    key={template.id}
                    className="group rounded-2xl p-6 bg-gradient-to-r from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Left side: Metadata */}
                      <div className="lg:w-1/4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {airline?.code || '??'}
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {airline?.name || 'Unknown Airline'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(template.type)}`}>
                                {template.type}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/10 to-purple-600/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {template.language}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(template.id)}
                            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                          >
                            <Pencil className="h-3 w-3 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyTemplate(template.template, template.id)}
                            className="rounded-xl border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          >
                            {copiedId === template.id ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(template.id)}
                            className="rounded-xl border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Right side: Template text */}
                      <div className="lg:w-3/4">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                          <div className="relative p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {template.template}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPage;