import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

export default function AboutUs() {
  const [role] = useState(() => localStorage.getItem('role') || 'User');
  const [aboutContent, setAboutContent] = useState({
    title: 'About Us',
    summary: 'KUCAAD connects alumni, faculty, and students through mentorship, opportunities, and shared university pride.',
    mission: 'Build a strong, active alumni network that supports careers, collaboration, and lifelong learning.',
    vision: 'Create a vibrant community where every KUCAAD member stays connected and contributes back.',
    what_we_do: "Share alumni stories, post opportunities, highlight events, and celebrate the association's journey.",
  });
  const [aboutForm, setAboutForm] = useState(aboutContent);
  const [aboutMessage, setAboutMessage] = useState('');
  const [aboutSaving, setAboutSaving] = useState(false);

  const isAdmin = ['Admin', 'admin'].includes(role);

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(apiUrl('/api/admin/about-us'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setAboutContent(data);
          setAboutForm({
            title: data.title || '',
            summary: data.summary || '',
            mission: data.mission || '',
            vision: data.vision || '',
            what_we_do: data.what_we_do || '',
          });
        }
      } catch {
        // Keep default content.
      }
    };

    void loadAbout();
  }, []);

  const handleAboutChange = (e) => {
    const { name, value } = e.target;
    setAboutForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAboutSave = async (e) => {
    e.preventDefault();
    setAboutSaving(true);
    setAboutMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/admin/about-us'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(aboutForm),
      });

      const data = await response.json();
      if (response.ok) {
        setAboutContent(aboutForm);
        setAboutMessage(data.message || 'About Us updated successfully.');
      } else {
        setAboutMessage(data.message || 'Failed to update About Us.');
      }
    } catch {
      setAboutMessage('Error saving About Us content.');
    }

    setAboutSaving(false);
  };

  return (
    <>
      <h1 className="page-title">About Us</h1>

      <section className="content-card dashboard-section about-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">Who we are</p>
            <h2>{aboutContent.title || 'About Us'}</h2>
          </div>
          <p className="section-copy">{aboutContent.summary}</p>
        </div>

        {isAdmin && (
          <form className="about-edit-form" onSubmit={handleAboutSave}>
            <div className="about-edit-header">
              <div>
                <p className="section-eyebrow">Admin edit mode</p>
                <h3>Write About Us</h3>
              </div>
              <button type="submit" className="primary-btn action-btn" disabled={aboutSaving}>
                {aboutSaving ? 'Saving...' : 'Save About Us'}
              </button>
            </div>

            <input
              name="title"
              className="input-field"
              value={aboutForm.title}
              onChange={handleAboutChange}
              placeholder="About Us title"
            />
            <textarea
              name="summary"
              className="input-field"
              value={aboutForm.summary}
              onChange={handleAboutChange}
              placeholder="Short summary"
              rows="3"
              style={{ resize: 'vertical' }}
            />
            <div className="about-edit-grid">
              <textarea
                name="mission"
                className="input-field"
                value={aboutForm.mission}
                onChange={handleAboutChange}
                placeholder="Mission"
                rows="4"
                style={{ resize: 'vertical' }}
              />
              <textarea
                name="vision"
                className="input-field"
                value={aboutForm.vision}
                onChange={handleAboutChange}
                placeholder="Vision"
                rows="4"
                style={{ resize: 'vertical' }}
              />
              <textarea
                name="what_we_do"
                className="input-field"
                value={aboutForm.what_we_do}
                onChange={handleAboutChange}
                placeholder="What we do"
                rows="4"
                style={{ resize: 'vertical', gridColumn: '1 / -1' }}
              />
            </div>

            {aboutMessage && <p className="about-message">{aboutMessage}</p>}
          </form>
        )}

        <div className="about-grid">
          <article className="about-card">
            <span className="about-icon">*</span>
            <h3>Our Mission</h3>
            <p>{aboutContent.mission}</p>
          </article>
          <article className="about-card">
            <span className="about-icon">O</span>
            <h3>Our Vision</h3>
            <p>{aboutContent.vision}</p>
          </article>
          <article className="about-card">
            <span className="about-icon">D</span>
            <h3>What We Do</h3>
            <p>{aboutContent.what_we_do}</p>
          </article>
        </div>
      </section>
    </>
  );
}
