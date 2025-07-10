'use client';

import React, { useEffect, useState } from 'react';
import { Trash, Pencil, PlusCircle, Search } from 'lucide-react';

interface Airline {
  id: number;
  name: string;
  fullName: string | null;
  code: string;
  icaoCode: string;
  country: string | null;
  state: string | null;
  logoUrl: string | null;
  defaultLanguage: string | null;
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
    country: string;
    state: string;
    logoUrl: string;
    defaultLanguage: string;
  }>({
    name: '',
    fullName: '',
    code: '',
    icaoCode: '',
    country: '',
    state: '',
    logoUrl: '',
    defaultLanguage: '',
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
        }

        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          setTemplates(Array.isArray(templateData?.data) ? templateData.data : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to load data. Please try again.');
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
      setErrorMessage('All fields are required');
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
        throw new Error(errorData?.data || response.statusText);
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
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save template');
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

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setErrorMessage('Failed to delete template');
    }
  };

  const handleAddAirline = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newAirline.name || !newAirline.code || !newAirline.icaoCode) {
      setErrorMessage('Airline name, code, and ICAO code are required');
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
          country: '',
          state: '',
          logoUrl: '',
          defaultLanguage: '',
        });
      } else {
        throw new Error('Failed to add airline');
      }
    } catch (error) {
      console.error('Error adding airline:', error);
      setErrorMessage('Failed to add airline');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.template.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dark">
      <div className="min-h-screen p-8 bg-white dark:bg-gray-900 dark:text-gray-200">
        <h1 className="text-3xl font-bold mb-6">Announcement Templates</h1>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={handleSearch}
          className="border p-3 mb-6 w-full rounded-lg dark:border-gray-700 dark:bg-gray-800"
        />

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <select
              name="airlineId"
              value={newTemplate.airlineId}
              onChange={handleChange}
              required
              className="border p-3 rounded-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Select Airline</option>
              {airlines.map(airline => (
                <option key={airline.id} value={airline.id}>
                  {airline.name}
                </option>
              ))}
            </select>

            <select
              name="type"
              value={newTemplate.type}
              onChange={handleChange}
              required
              className="border p-3 rounded-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="">Select Type</option>
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

            <input
              type="text"
              name="language"
              placeholder="Language"
              value={newTemplate.language}
              onChange={handleChange}
              required
              className="border p-3 rounded-lg dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <textarea
            name="template"
            placeholder="Template Text"
            value={newTemplate.template}
            onChange={handleChange}
            required
            className="border p-3 mb-4 w-full rounded-lg dark:border-gray-700 dark:bg-gray-800"
            rows={4}
          />

          <button
            type="submit"
            className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 dark:bg-blue-700"
          >
            {newTemplate.id ? 'Update Template' : 'Save Template'}
          </button>
        </form>

        <h2 className="text-2xl font-semibold mb-4">Add New Airline</h2>

        <form onSubmit={handleAddAirline} className="mb-6">
          <input
            type="text"
            name="name"
            placeholder="Airline Name"
            value={newAirline.name}
            onChange={handleAirlineChange}
            required
            className="border p-3 mb-4 w-full rounded-lg dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            type="text"
            name="code"
            placeholder="Airline Code"
            value={newAirline.code}
            onChange={handleAirlineChange}
            required
            className="border p-3 mb-4 w-full rounded-lg dark:border-gray-700 dark:bg-gray-800"
          />
          <input
            type="text"
            name="icaoCode"
            placeholder="ICAO Code"
            value={newAirline.icaoCode}
            onChange={handleAirlineChange}
            required
            className="border p-3 mb-4 w-full rounded-lg dark:border-gray-700 dark:bg-gray-800"
          />

          <button
            type="submit"
            className="bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 dark:bg-green-700"
          >
            Add Airline
          </button>
        </form>

        <table className="table-auto w-full border-collapse">
          <thead className="hidden sm:table-header-group">
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="px-4 py-2">Template</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Language</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((template) => (
              <tr
                key={template.id}
                className="odd:bg-gray-50 even:bg-white dark:odd:bg-gray-800 dark:even:bg-gray-900"
              >
                <td className="px-4 py-2 sm:table-cell flex flex-col sm:flex-row">
                  <span className="sm:hidden font-semibold">Template:</span>
                  {template.template}
                </td>
                <td className="px-4 py-2 sm:table-cell flex flex-col sm:flex-row">
                  <span className="sm:hidden font-semibold">Type:</span>
                  {template.type}
                </td>
                <td className="px-4 py-2 sm:table-cell flex flex-col sm:flex-row">
                  <span className="sm:hidden font-semibold">Language:</span>
                  {template.language}
                </td>
                <td className="px-4 py-2 sm:table-cell flex flex-col sm:flex-row gap-2">
                  <span className="sm:hidden font-semibold">Actions:</span>
                  <button
                    onClick={() => handleEdit(template.id)}
                    className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 dark:bg-yellow-700 w-full sm:w-32"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 dark:bg-red-700 w-full sm:w-32"
                  >
                    <Trash className="w-4 h-4" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnnouncementPage;
