import { useState } from 'react';
import { apiUrl } from '../lib/api';

function Profile() {
  const [formData, setFormData] = useState({
    full_name: '',
    course: '',
    batch_mode: 'year',
    batch_year: '2020',
    batch_start_year: '2020',
    batch_end_year: '2022',
    current_job: '',
    company: '',
    linkedin_url: '',
    bio: ''
  });
  const [message, setMessage] = useState('');

  const yearOptions = Array.from({ length: 2030 - 1970 + 1 }, (_, index) => 1970 + index);
  const courseOptions = ['M.Com', 'M.Phil', 'Ph.D', 'Faculty Member', 'PGDEF'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'batch_mode') {
      setFormData((prev) => ({ ...prev, batch_mode: value }));
      return;
    }

    if (name === 'batch_start_year') {
      setFormData((prev) => ({
        ...prev,
        batch_start_year: value,
        batch_end_year: Number(prev.batch_end_year) < Number(value) ? value : prev.batch_end_year,
      }));
      return;
    }

    if (name === 'batch_end_year') {
      setFormData((prev) => ({
        ...prev,
        batch_end_year: value,
        batch_start_year: Number(value) < Number(prev.batch_start_year) ? value : prev.batch_start_year,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatBatchLabel = () => {
    if (formData.batch_mode === 'year') {
      return formData.batch_year;
    }

    const start = Number(formData.batch_start_year);
    const end = Number(formData.batch_end_year);
    if (!start || !end) return '';
    if (start === end) return String(start);

    const endSuffix = String(end).slice(-2);
    const sameCentury = Math.floor(start / 100) === Math.floor(end / 100);
    return sameCentury ? `${start}-${endSuffix}` : `${start}-${end}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        batch_type: formData.batch_mode,
        graduation_year: formData.batch_mode === 'year' ? formData.batch_year : formData.batch_start_year,
        batch_label: formatBatchLabel(),
      };

      const response = await fetch(apiUrl('/api/profile'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage(data.message || 'Update failed');
      }
    } catch {
      setMessage('Error connecting to server');
    }
  };

  return (
    <>
      <h1 className="page-title">Edit My Profile</h1>
      
      <div className="content-card" style={{ maxWidth: '800px' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          Update your professional details to stay connected with the KUCAAD network.
        </p>

        <form onSubmit={handleSave} className="profile-form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Full Name</label>
            <input type="text" name="full_name" className="input-field" placeholder="John Doe" value={formData.full_name} onChange={handleChange} required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Course</label>
            <select name="course" className="input-field" value={formData.course} onChange={handleChange} required>
              <option value="">Select course</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className="profile-batch-panel">
            <div className="profile-batch-switch">
              <button
                type="button"
                className={`profile-switch-btn ${formData.batch_mode === 'year' ? 'active' : ''}`}
                onClick={() => setFormData((prev) => ({ ...prev, batch_mode: 'year' }))}
              >
                Particular Year
              </button>
              <button
                type="button"
                className={`profile-switch-btn ${formData.batch_mode === 'range' ? 'active' : ''}`}
                onClick={() => setFormData((prev) => ({ ...prev, batch_mode: 'range' }))}
              >
                Batch Range
              </button>
            </div>

            {formData.batch_mode === 'year' ? (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Batch / Year</label>
                <select name="batch_year" className="input-field" value={formData.batch_year} onChange={handleChange} required>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="profile-batch-range">
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start Year</label>
                  <select name="batch_start_year" className="input-field" value={formData.batch_start_year} onChange={handleChange} required>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>End Year</label>
                  <select name="batch_end_year" className="input-field" value={formData.batch_end_year} onChange={handleChange} required>
                    {yearOptions
                      .filter((year) => year >= Number(formData.batch_start_year))
                      .map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            <div className="profile-batch-preview">
              <span>Preview</span>
              <strong>{formatBatchLabel() || 'Select a year or range'}</strong>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>LinkedIn Profile</label>
            <input type="url" name="linkedin_url" className="input-field" placeholder="https://linkedin.com/in/..." value={formData.linkedin_url} onChange={handleChange} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Current Job Title</label>
            <input type="text" name="current_job" className="input-field" placeholder="Financial Analyst" value={formData.current_job} onChange={handleChange} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Company</label>
            <input type="text" name="company" className="input-field" placeholder="Google" value={formData.company} onChange={handleChange} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Short Bio</label>
            <textarea name="bio" className="input-field" placeholder="Tell us a little about your career journey..." value={formData.bio} onChange={handleChange} rows="4" style={{ resize: 'vertical' }}></textarea>
          </div>
          
          <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
            <button type="submit" className="primary-btn action-btn">Save Profile Changes</button>
          </div>
        </form>

        {message && (
          <div style={{ marginTop: '24px', padding: '16px', background: message.includes('failed') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: message.includes('failed') ? '#ef4444' : '#22c55e', borderRadius: '8px', fontWeight: '500' }}>
            {message}
          </div>
        )}
      </div>
    </>
  );
}

export default Profile;
