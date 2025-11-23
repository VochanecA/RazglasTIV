'use client';

import React, { useEffect, useState } from 'react';
import { Trash, Pencil, PlusCircle, Search, Save, XCircle, Plane } from 'lucide-react';

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

  // Fetch data for airlines and templates
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

    // Validate required fields
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

      // Reset form
      setNewTemplate({
        airlineId: '',
        type: '',
        language: '',
        template: ''
      });
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
    }
  };

  const handleCancelEdit = () => {
    setNewTemplate({
      airlineId: '',
      type: '',
      language: '',
      template: '',
    });
    setErrorMessage(''); // Clear error message when canceling
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    setErrorMessage('');
    try {
      const response = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
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

        // Reset form
        setNewAirline({
          name: '',
          fullName: '',
          code: '',
          icaoCode: '',
        });
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.data || response.statusText || 'Failed to add airline.');
      }
    } catch (error) {
      console.error('Error adding airline:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add airline.');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const airlineName = airlines.find(a => a.id === template.airlineId)?.name || '';
    return (
      template.template.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airlineName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-blue-700 dark:text-teal-400">
          Manage Announcement Templates
        </h1>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between mb-6 shadow-sm dark:bg-red-900 dark:bg-opacity-20 dark:text-red-300 dark:border-red-700">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 ml-4">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search templates by text, type, language, or airline..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-teal-500 dark:focus:border-teal-500 transition-colors shadow-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
        </div>


        {/* ## Add/Edit Template Section */}

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100 flex items-center">
            <PlusCircle className="h-6 w-6 mr-2 text-blue-500 dark:text-teal-400" />
            {newTemplate.id ? 'Edit Announcement Template' : 'Create New Announcement Template'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Airline Select */}
              <div className="relative">
                <select
                  name="airlineId"
                  value={newTemplate.airlineId}
                  onChange={handleChange}
                  required
                  className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-teal-500 dark:focus:border-teal-500 appearance-none"
                >
                  <option value="" disabled>Select Airline</option>
                  {airlines.map(airline => (
                    <option key={airline.id} value={airline.id}>
                      {airline.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              {/* Type Select */}
              <div className="relative">
                <select
                  name="type"
                  value={newTemplate.type}
                  onChange={handleChange}
                  required
                  className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-teal-500 dark:focus:border-teal-500 appearance-none"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              {/* Language Input */}
              <input
                type="text"
                name="language"
                placeholder="Language (e.g., EN, SR, RU)"
                value={newTemplate.language}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-teal-500 dark:focus:border-teal-500"
              />
            </div>

            {/* Template Textarea */}
            <textarea
              name="template"
              placeholder="Enter announcement template text here..."
              value={newTemplate.template}
              onChange={handleChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-teal-500 dark:focus:border-teal-500 resize-y"
              rows={4}
            />

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-500 dark:focus:ring-offset-gray-800 transition-colors shadow-md"
              >
                <Save className="h-5 w-5 mr-2" />
                {newTemplate.id ? 'Update Template' : 'Save Template'}
              </button>
              {newTemplate.id && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center justify-center px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 dark:focus:ring-gray-400 dark:focus:ring-offset-gray-800 transition-colors shadow-md"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>
{/* 
        ---

        ## Add New Airline Section */}

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100 flex items-center">
            <Plane className="h-6 w-6 mr-2 text-green-500 dark:text-lime-400" />
            Add New Airline
          </h2>
          <form onSubmit={handleAddAirline} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Airline Name (e.g., Air Montenegro)"
              value={newAirline.name}
              onChange={handleAirlineChange}
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-lime-500 dark:focus:border-lime-500"
            />
            <input
              type="text"
              name="fullName"
              placeholder="Full Airline Name (Optional)"
              value={newAirline.fullName || ''}
              onChange={handleAirlineChange}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-lime-500 dark:focus:border-lime-500"
            />
            <input
              type="text"
              name="code"
              placeholder="Airline 2-letter Code (e.g., YM)"
              value={newAirline.code}
              onChange={handleAirlineChange}
              required
              maxLength={2}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-lime-500 dark:focus:border-lime-500"
            />
            <input
              type="text"
              name="icaoCode"
              placeholder="ICAO 3-letter Code (e.g., MNE)"
              value={newAirline.icaoCode}
              onChange={handleAirlineChange}
              required
              maxLength={3}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-1 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:focus:ring-lime-500 dark:focus:border-lime-500"
            />

            <button
              type="submit"
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-lime-600 dark:hover:bg-lime-700 dark:focus:ring-lime-500 dark:focus:ring-offset-gray-800 transition-colors shadow-md"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add New Airline
            </button>
          </form>
        </section>

        {/* ---

        ## Templates List */}

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100">
            Available Templates
          </h2>
          {filteredTemplates.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No templates found. Try adjusting your search or add a new template!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Airline
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Language
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Template Text
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {airlines.find(a => a.id === template.airlineId)?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {template.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {template.language}
                      </td>
                      {/* REMOVED 'max-w-xs truncate' from this line */}
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {template.template}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleEdit(template.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700 dark:focus:ring-yellow-400"
                            title="Edit Template"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only ml-1">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700 dark:focus:ring-red-400"
                            title="Delete Template"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only ml-1">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AnnouncementPage;