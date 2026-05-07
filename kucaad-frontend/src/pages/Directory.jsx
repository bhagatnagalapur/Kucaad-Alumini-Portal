import { useState, useEffect } from 'react';
import { apiUrl } from '../lib/api';

function Directory() {
  const [alumni, setAlumni] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchMode, setBatchMode] = useState('year');
  const [batchYear, setBatchYear] = useState('2020');
  const [batchStartYear, setBatchStartYear] = useState('2020');
  const [batchEndYear, setBatchEndYear] = useState('2022');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const yearOptions = Array.from({ length: 2030 - 1970 + 1 }, (_, index) => 1970 + index);

  const buildBatchLabel = () => {
    if (batchMode === 'year') {
      return batchYear;
    }

    if (batchStartYear === batchEndYear) {
      return String(batchStartYear);
    }

    return `${batchStartYear}-${String(batchEndYear).slice(-2)}`;
  };

  const fetchDirectory = async (name = '', batchQuery = {}, pageNo = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (name) params.append('name', name);
      params.append('page', pageNo);
      params.append('limit', 9);
      Object.entries(batchQuery).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(apiUrl(`/api/profile/directory?${params.toString()}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAlumni(data.data || []);
        setPage(data.page || pageNo);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching directory', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchDirectory();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    if (batchMode === 'range') {
      fetchDirectory(searchTerm, {
        batch_mode: 'range',
        batch_label: buildBatchLabel(),
        batch_start_year: batchStartYear,
        batch_end_year: batchEndYear,
      }, 1);
      return;
    }

    fetchDirectory(searchTerm, {
      year: batchYear,
    }, 1);
  };

  return (
    <>
      <h1 className="page-title">Alumni Directory</h1>
      
      <div className="content-card" style={{ marginBottom: '32px' }}>
        <form onSubmit={handleSearch} className="directory-search-form">
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search by name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '2', minWidth: '220px', marginBottom: 0 }}
          />

          <div className="profile-batch-panel directory-batch-panel">
            <div className="profile-batch-switch">
              <button
                type="button"
                className={`profile-switch-btn ${batchMode === 'year' ? 'active' : ''}`}
                onClick={() => setBatchMode('year')}
              >
                Particular Year
              </button>
              <button
                type="button"
                className={`profile-switch-btn ${batchMode === 'range' ? 'active' : ''}`}
                onClick={() => setBatchMode('range')}
              >
                Batch Range
              </button>
            </div>

            {batchMode === 'year' ? (
              <select
                className="input-field"
                value={batchYear}
                onChange={(e) => setBatchYear(e.target.value)}
                style={{ marginBottom: 0 }}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            ) : (
              <div className="profile-batch-range">
                <select
                  className="input-field"
                  value={batchStartYear}
                  onChange={(e) => {
                    const nextStart = e.target.value;
                    setBatchStartYear(nextStart);
                    if (Number(batchEndYear) < Number(nextStart)) {
                      setBatchEndYear(nextStart);
                    }
                  }}
                  style={{ marginBottom: 0 }}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={batchEndYear}
                  onChange={(e) => setBatchEndYear(e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  {yearOptions
                    .filter((year) => year >= Number(batchStartYear))
                    .map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                </select>
              </div>
            )}

            <div className="profile-batch-preview">
              <span>Batch preview</span>
              <strong>{batchMode === 'year' ? batchYear : buildBatchLabel()}</strong>
            </div>
          </div>

          <button type="submit" className="primary-btn action-btn" style={{ alignSelf: 'flex-start' }}>Search</button>
        </form>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading directory...</p> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {alumni.map((alum, index) => (
              <div key={index} className="content-card" style={{ borderTop: '4px solid var(--accent-gold)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-main)' }}>{alum.full_name || alum.email}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}><strong>Course:</strong> {alum.course || 'N/A'}</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <strong>Batch:</strong> {alum.batch_label || alum.graduation_year || 'N/A'}
                </p>
                <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}><strong>Job:</strong> {alum.current_job || 'N/A'}</p>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}><strong>Company:</strong> {alum.company || 'N/A'}</p>
                {alum.linkedin_url && (
                  <a href={alum.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '500' }}>
                    View LinkedIn &rarr;
                  </a>
                )}
              </div>
            ))}
            {alumni.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No alumni found matching your criteria.</p>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              type="button"
              className="profile-switch-btn"
              onClick={() => {
                const nextPage = Math.max(page - 1, 1);
                setPage(nextPage);
                fetchDirectory(searchTerm, batchMode === 'range'
                  ? {
                      batch_mode: 'range',
                      batch_label: buildBatchLabel(),
                      batch_start_year: batchStartYear,
                      batch_end_year: batchEndYear,
                    }
                  : { year: batchYear }, nextPage);
              }}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span style={{ color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="profile-switch-btn"
              onClick={() => {
                const nextPage = Math.min(page + 1, totalPages);
                setPage(nextPage);
                fetchDirectory(searchTerm, batchMode === 'range'
                  ? {
                      batch_mode: 'range',
                      batch_label: buildBatchLabel(),
                      batch_start_year: batchStartYear,
                      batch_end_year: batchEndYear,
                    }
                  : { year: batchYear }, nextPage);
              }}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default Directory;
