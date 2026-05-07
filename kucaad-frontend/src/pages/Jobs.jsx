import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', company: '', description: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = async (pageNo = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/jobs?page=${pageNo}&limit=6`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setJobs(data.data || []);
        setPage(data.page || pageNo);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching jobs', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => { void fetchJobs(); }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/jobs'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setFormData({ title: '', company: '', description: '' });
        setShowForm(false);
        fetchJobs(page); // Refresh jobs
      }
    } catch (error) {
      console.error('Error posting job', error);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Job & Internship Board</h1>
        <button className="primary-btn action-btn gold-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Post a Job'}
        </button>
      </div>

      {showForm && (
        <div className="content-card" style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px' }}>Post a New Opportunity</h3>
          <form onSubmit={handlePostJob}>
            <input type="text" className="input-field" placeholder="Job Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            <input type="text" className="input-field" placeholder="Company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} required />
            <textarea className="input-field" placeholder="Job Description & How to Apply" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required rows="4"></textarea>
            <button type="submit" className="primary-btn action-btn">Submit Post</button>
          </form>
        </div>
      )}

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading opportunities...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {jobs.map((job) => (
            <div key={job.id} className="content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-main)' }}>{job.title}</h3>
                  <p style={{ color: 'var(--accent-gold)', fontWeight: '500', marginBottom: '16px' }}>{job.company}</p>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)', lineHeight: '1.6' }}>{job.description}</p>
              
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Posted by: {job.posted_by}</span>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No jobs posted yet.</p>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          className="profile-switch-btn"
          onClick={() => {
            const nextPage = Math.max(page - 1, 1);
            fetchJobs(nextPage);
          }}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
        <button
          type="button"
          className="profile-switch-btn"
          onClick={() => {
            const nextPage = Math.min(page + 1, totalPages);
            fetchJobs(nextPage);
          }}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </>
  );
}

export default Jobs;
