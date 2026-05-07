import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

export default function Notices() {
  const [role] = useState(() => localStorage.getItem('role') || 'User');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    body: '',
    priority: 'Normal',
  });
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeSaving, setNoticeSaving] = useState(false);

  const isAdmin = ['Admin', 'admin'].includes(role);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/notices?limit=30'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setNotices(data.data || []);
      }
    } catch {
      // Keep the page usable on transient failures.
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadNotices();
  }, []);

  const handleNoticeChange = (e) => {
    const { name, value } = e.target;
    setNoticeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNoticeSave = async (e) => {
    e.preventDefault();
    setNoticeSaving(true);
    setNoticeMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/notices'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noticeForm),
      });

      const data = await response.json();
      if (response.ok) {
        setNoticeMessage(data.message || 'Notice published successfully.');
        setNoticeForm({ title: '', body: '', priority: 'Normal' });
        await loadNotices();
      } else {
        setNoticeMessage(data.message || 'Failed to publish notice.');
      }
    } catch {
      setNoticeMessage('Error saving notice.');
    }

    setNoticeSaving(false);
  };

  return (
    <>
      <h1 className="page-title">Notices & Announcements</h1>

      <section className="content-card dashboard-section notice-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">Latest updates</p>
            <h2>Association Notices</h2>
          </div>
          <p className="section-copy">
            Important updates for all members in one place.
          </p>
        </div>

        {isAdmin && (
          <form className="notice-editor" onSubmit={handleNoticeSave}>
            <div className="about-edit-header">
              <div>
                <p className="section-eyebrow">Admin publish mode</p>
                <h3>Post a notice</h3>
              </div>
              <button type="submit" className="primary-btn action-btn" disabled={noticeSaving}>
                {noticeSaving ? 'Publishing...' : 'Publish Notice'}
              </button>
            </div>

            <div className="notice-editor-grid">
              <input
                name="title"
                className="input-field"
                placeholder="Notice title"
                value={noticeForm.title}
                onChange={handleNoticeChange}
                required
              />
              <select
                name="priority"
                className="input-field"
                value={noticeForm.priority}
                onChange={handleNoticeChange}
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
              <textarea
                name="body"
                className="input-field"
                placeholder="Notice details"
                value={noticeForm.body}
                onChange={handleNoticeChange}
                rows="4"
                style={{ resize: 'vertical', gridColumn: '1 / -1' }}
                required
              />
            </div>

            {noticeMessage && <p className="about-message">{noticeMessage}</p>}
          </form>
        )}

        <div className="notice-list">
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading notices...</p>
          ) : notices.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No notices published yet.</p>
          ) : (
            notices.map((notice) => (
              <article key={notice.id} className={`notice-card priority-${String(notice.priority || 'Normal').toLowerCase()}`}>
                <div className="notice-card-head">
                  <span className="notice-priority">{notice.priority || 'Normal'}</span>
                  <span className="notice-date">{new Date(notice.created_at).toLocaleDateString()}</span>
                </div>
                <h3>{notice.title}</h3>
                <p>{notice.body}</p>
                <span className="notice-author">Posted by {notice.created_by || 'System'}</span>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
