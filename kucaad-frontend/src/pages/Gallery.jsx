import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../lib/api';

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null,
  });

  const role = localStorage.getItem('role') || 'Student';
  const canUpload = useMemo(
    () => ['Admin', 'admin', 'Executive Member', 'executive member'].includes(role),
    [role]
  );

  const fetchGallery = async (pageNo = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/gallery?page=${pageNo}&limit=9`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setGalleryItems(data.data || []);
        setPage(data.page || pageNo);
        setTotalPages(data.totalPages || 1);
      } else {
        setMessage(data.message || 'Failed to load gallery items.');
      }
    } catch {
      setMessage('Error connecting to server.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => { void fetchGallery(); }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setFormData((prev) => ({ ...prev, file: files?.[0] || null }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      setMessage('Please choose an image to upload.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const imageData = await fileToDataUrl(formData.file);
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/gallery'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          image_data: imageData,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Gallery image uploaded successfully.');
        setFormData({ title: '', description: '', file: null });
        await fetchGallery(page);
      } else {
        setMessage(data.message || 'Upload failed.');
      }
    } catch {
      setMessage('Error uploading image.');
    }

    setUploading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ marginBottom: '8px' }}>
          Alumni Gallery
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Memories, milestones & moments from the Karnatak University alumni community.
        </p>
        <div
          style={{
            marginTop: '12px',
            height: '3px',
            width: '60px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, var(--kud-gold), var(--kud-secondary))',
          }}
        />
      </div>

      {canUpload && (
        <div className="content-card" style={{ marginBottom: '28px' }}>
          <h2 style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Upload Gallery Image</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '18px' }}>
            Admin and Executive Member users can post official gallery moments here.
          </p>

          <form onSubmit={handleUpload} className="gallery-upload-form">
            <input
              type="text"
              name="title"
              className="input-field"
              placeholder="Image title"
              value={formData.title}
              onChange={handleChange}
              required
            />
            <textarea
              name="description"
              className="input-field"
              placeholder="Short description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              style={{ resize: 'vertical' }}
            />
            <input
              type="file"
              name="file"
              className="input-field"
              accept="image/*"
              onChange={handleChange}
              required
            />
            <button type="submit" className="primary-btn action-btn" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload to Gallery'}
            </button>
          </form>

          {message && (
            <div
              style={{
                marginTop: '16px',
                padding: '14px 16px',
                borderRadius: '10px',
                background: message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(34, 197, 94, 0.12)',
                color: message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                  ? '#f87171'
                  : '#86efac',
              }}
            >
              {message}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading gallery...</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {galleryItems.map((item) => (
            <GalleryCard key={item.id} item={item} />
          ))}
          {galleryItems.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No gallery items uploaded yet.</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          className="profile-switch-btn"
          onClick={() => {
            const nextPage = Math.max(page - 1, 1);
            fetchGallery(nextPage);
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
            fetchGallery(nextPage);
          }}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function GalleryCard({ item }) {
  const imageSrc = item.image_data || '';

  return (
    <div
      className="content-card gallery-feed-card"
      style={{ padding: 0, overflow: 'hidden' }}
    >
      <div className="gallery-feed-image">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : null}
      </div>

      <div style={{ padding: '16px 18px 18px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--kud-gold-light)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
          {item.created_by}
        </p>
        <h3 style={{ fontSize: '1.02rem', color: 'var(--text-main)', marginBottom: '6px' }}>
          {item.title}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {item.description || 'Association moment'}
        </p>
      </div>
    </div>
  );
}
