import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (activeTab === 'users') {
        const res = await axios.get(`${API_URL}/admin/pending`, { headers });
        setPendingUsers(res.data);
      } else if (activeTab === 'jobs') {
        const res = await axios.get(`${API_URL}/admin/jobs/pending`, { headers });
        setPendingJobs(res.data);
      } else if (activeTab === 'events') {
        const res = await axios.get(`${API_URL}/admin/events/pending`, { headers });
        setPendingEvents(res.data);
      }
    } catch (err) {
      setError('Failed to fetch pending approvals. ' + (err.response?.data?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type, id, action) => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const status = action === 'approve' ? 'approved' : 'rejected';

    try {
      let endpoint = '';
      if (type === 'user') endpoint = `${API_URL}/admin/update-status/${id}`;
      else if (type === 'job') endpoint = `${API_URL}/admin/jobs/${id}`;
      else if (type === 'event') endpoint = `${API_URL}/admin/events/${id}`;

      await axios.put(endpoint, { status }, { headers });
      setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} ${status} successfully!`);
      setTimeout(() => setMessage(''), 3000);
      fetchData();
    } catch (err) {
      setError(`Failed to ${action} ${type}.`);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <AlertCircle className="w-8 h-8 text-[#D4AF37]" />
          Admin Moderation Panel
        </h1>
        <p className="text-gray-600 mt-2">Manage pending approvals for users, job postings, and events.</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'users' ? 'text-[#002147]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Approvals
            {pendingUsers.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
            )}
          </div>
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#002147] rounded-t-full" />}
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'jobs' ? 'text-[#002147]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Job Postings
            {pendingJobs.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingJobs.length}</span>
            )}
          </div>
          {activeTab === 'jobs' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#002147] rounded-t-full" />}
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-4 px-4 font-medium transition-colors relative ${
            activeTab === 'events' ? 'text-[#002147]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events
            {pendingEvents.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingEvents.length}</span>
            )}
          </div>
          {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#002147] rounded-t-full" />}
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Clock className="w-10 h-10 animate-spin mx-auto mb-4 text-[#0099FF]" />
            Loading pending data...
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'users' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Email / Member ID</th>
                    <th className="px-6 py-4">Batch / Course</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">No pending users for approval.</td>
                    </tr>
                  ) : (
                    pendingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{user.full_name}</td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-gray-600">{user.course} ({user.graduation_year})</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleAction('user', user.id, 'approve')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => handleAction('user', user.id, 'reject')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'jobs' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Job Title</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Posted By</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingJobs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">No pending job postings.</td>
                    </tr>
                  ) : (
                    pendingJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{job.title}</td>
                        <td className="px-6 py-4 text-gray-600">{job.company}</td>
                        <td className="px-6 py-4 text-gray-600">{job.full_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleAction('job', job.id, 'approve')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => handleAction('job', job.id, 'reject')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'events' && (
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Event Title</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Created By</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingEvents.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500">No pending events.</td>
                    </tr>
                  ) : (
                    pendingEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                        <td className="px-6 py-4 text-gray-600">{new Date(event.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-gray-600">{event.full_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleAction('event', event.id, 'approve')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle className="w-6 h-6" />
                            </button>
                            <button
                              onClick={() => handleAction('event', event.id, 'reject')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
