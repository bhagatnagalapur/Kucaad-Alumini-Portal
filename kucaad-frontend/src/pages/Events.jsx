import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../lib/api';

/* ── Helpers ── */
const getEventStatus = (dateStr) => {
  const now = new Date();
  const eventDate = new Date(dateStr);
  const diffMs = eventDate - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) return 'past';
  if (diffHours <= 4) return 'ongoing';
  return 'upcoming';
};

const formatEventDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatEventTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getCountdown = (dateStr) => {
  const now = new Date();
  const eventDate = new Date(dateStr);
  const diffMs = eventDate - now;
  if (diffMs <= 0) return null;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h`;
  return 'Starting soon';
};

const STATUS_LABELS = { upcoming: '🔵 Upcoming', ongoing: '🟡 Ongoing', past: '⬛ Past' };

/* ── Main Component ── */
function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');     // 'all' | 'upcoming' | 'past'
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', location: '' });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rsvpLoading, setRsvpLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});

  const role = localStorage.getItem('role') || 'Student';
  const isOrganiser = ['Admin', 'admin', 'Professor'].includes(role);

  /* ── Fetch events ── */
  const fetchEvents = useCallback(async (pageNo = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/events?page=${pageNo}&limit=6`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(data.data || []);
        setPage(data.page || pageNo);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching events', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  /* ── Post new event ── */
  const handlePostEvent = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.title.trim() || !formData.date) {
      setFormError('Title and date are required.');
      return;
    }
    setFormSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/events'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ title: '', description: '', date: '', location: '' });
        setShowForm(false);
        void fetchEvents(page);
      } else {
        const d = await res.json();
        setFormError(d.message || 'Failed to post event.');
      }
    } catch {
      setFormError('Network error. Please try again.');
    }
    setFormSubmitting(false);
  };

  /* ── Delete event ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    setDeleteLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/events/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev.id !== id));
      }
    } catch {
      /* ignore */
    }
    setDeleteLoading((prev) => ({ ...prev, [id]: false }));
  };

  /* ── Toggle RSVP ── */
  const handleRsvp = async (evt) => {
    setRsvpLoading((prev) => ({ ...prev, [evt.id]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/events/${evt.id}/rsvp`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === evt.id
              ? {
                  ...ev,
                  has_rsvp: data.rsvped ? 1 : 0,
                  rsvp_count: data.rsvped ? ev.rsvp_count + 1 : Math.max(ev.rsvp_count - 1, 0),
                }
              : ev
          )
        );
      }
    } catch {
      /* ignore */
    }
    setRsvpLoading((prev) => ({ ...prev, [evt.id]: false }));
  };

  /* ── Filtered events ── */
  const filteredEvents = events.filter((ev) => {
    if (filter === 'all') return true;
    const status = getEventStatus(ev.date);
    if (filter === 'upcoming') return status === 'upcoming' || status === 'ongoing';
    if (filter === 'past') return status === 'past';
    return true;
  });

  const counts = {
    all: events.length,
    upcoming: events.filter((ev) => getEventStatus(ev.date) !== 'past').length,
    past: events.filter((ev) => getEventStatus(ev.date) === 'past').length,
  };

  return (
    <>
      {/* ── Header ── */}
      <div className="events-header">
        <div>
          <p className="section-eyebrow">Alumni Community</p>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Events &amp; Meetups</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Stay connected through campus gatherings, career panels, and reunions.
          </p>
        </div>
        {isOrganiser && (
          <button
            className={`primary-btn action-btn ${showForm ? '' : 'gold-btn'}`}
            onClick={() => { setShowForm(!showForm); setFormError(''); }}
          >
            {showForm ? '✕ Cancel' : '+ Post Event'}
          </button>
        )}
      </div>

      {/* ── Post Form ── */}
      {showForm && isOrganiser && (
        <div className="event-post-form">
          <h3>📅 Post a New Event</h3>
          <form onSubmit={handlePostEvent}>
            <div className="event-post-grid">
              <input
                type="text"
                className="input-field"
                placeholder="Event Title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <input
                type="datetime-local"
                className="input-field"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <input
                type="text"
                className="input-field"
                placeholder="Location (optional)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <textarea
                className="input-field"
                placeholder="Event description, agenda, special instructions..."
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
            {formError && (
              <p style={{ color: '#ef4444', fontSize: '0.88rem', marginBottom: '12px' }}>{formError}</p>
            )}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button type="submit" className="primary-btn action-btn" disabled={formSubmitting}>
                {formSubmitting ? 'Posting...' : 'Submit Event'}
              </button>
              <button
                type="button"
                className="profile-switch-btn"
                onClick={() => { setShowForm(false); setFormError(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter Tabs ── */}
      <div className="events-filter-tabs">
        {[
          { key: 'all', label: `All  (${counts.all})` },
          { key: 'upcoming', label: `Upcoming  (${counts.upcoming})` },
          { key: 'past', label: `Past  (${counts.past})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`events-filter-tab ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Events Grid ── */}
      {loading ? (
        <div className="events-grid">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="event-card"
              style={{ minHeight: 200, animation: 'pulse 1.6s ease-in-out infinite', opacity: 0.5 }}
            />
          ))}
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.length === 0 ? (
            <div className="event-empty">
              <div className="event-empty-icon">📅</div>
              <p>No {filter !== 'all' ? filter : ''} events found.</p>
              {isOrganiser && (
                <button
                  className="primary-btn action-btn gold-btn"
                  style={{ marginTop: 16 }}
                  onClick={() => setShowForm(true)}
                >
                  + Post the first event
                </button>
              )}
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const status = getEventStatus(evt.date);
              const countdown = getCountdown(evt.date);
              const rsvped = Boolean(evt.has_rsvp);

              return (
                <article key={evt.id} className="event-card">
                  {/* Coloured top stripe */}
                  <div className={`event-card-banner ${status}`} />

                  <div className="event-card-body">
                    {/* Title + Status badge */}
                    <div className="event-card-top">
                      <h3 className="event-card-title">{evt.title}</h3>
                      <span className={`event-status-badge ${status}`}>
                        {STATUS_LABELS[status]}
                      </span>
                    </div>

                    {/* Date / Location / Countdown */}
                    <div className="event-card-meta">
                      <div className="event-meta-row">
                        <span className="event-meta-icon">📅</span>
                        <span>{formatEventDate(evt.date)} · {formatEventTime(evt.date)}</span>
                      </div>
                      {evt.location && (
                        <div className="event-meta-row">
                          <span className="event-meta-icon">📍</span>
                          <span>{evt.location}</span>
                        </div>
                      )}
                      {countdown && (
                        <div className="event-meta-row">
                          <span className="event-meta-icon">⏳</span>
                          <span style={{ color: 'var(--kud-secondary)', fontWeight: 600 }}>{countdown}</span>
                        </div>
                      )}
                      <div className="event-meta-row">
                        <span className="event-meta-icon">👥</span>
                        <span>{evt.rsvp_count} {evt.rsvp_count === 1 ? 'person' : 'people'} going</span>
                      </div>
                    </div>

                    {/* Description */}
                    {evt.description && (
                      <p className="event-card-description">{evt.description}</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="event-card-footer">
                    <span className="event-poster">Posted by {evt.created_by}</span>
                    <div className="event-card-actions">
                      {/* RSVP – only for upcoming/ongoing */}
                      {status !== 'past' && (
                        <button
                          className={`event-rsvp-btn ${rsvped ? 'rsvped' : ''}`}
                          onClick={() => handleRsvp(evt)}
                          disabled={rsvpLoading[evt.id]}
                          title={rsvped ? 'Cancel RSVP' : 'RSVP to this event'}
                        >
                          {rsvpLoading[evt.id]
                            ? '...'
                            : rsvped
                            ? '✓ Going'
                            : '+ RSVP'}
                        </button>
                      )}
                      {/* Delete – organizers only */}
                      {isOrganiser && (
                        <button
                          className="event-delete-btn"
                          onClick={() => handleDelete(evt.id)}
                          disabled={deleteLoading[evt.id]}
                          title="Delete event"
                        >
                          {deleteLoading[evt.id] ? '...' : '🗑'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            className="profile-switch-btn"
            onClick={() => fetchEvents(Math.max(page - 1, 1))}
            disabled={page <= 1}
          >
            ← Previous
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="profile-switch-btn"
            onClick={() => fetchEvents(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}

export default Events;
