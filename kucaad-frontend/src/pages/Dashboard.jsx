import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../lib/api';

const DEFAULT_EXECUTIVES = [
  {
    name: 'Dr. Ananya Rao',
    role: 'President',
    bio: 'Leads alumni strategy and community engagement.',
    photo_url: '',
    order_index: 1,
  },
  {
    name: 'Mr. Kiran Shetty',
    role: 'Vice President',
    bio: 'Supports partnerships, events, and student outreach.',
    photo_url: '',
    order_index: 2,
  },
  {
    name: 'Ms. Megha Patil',
    role: 'Secretary',
    bio: 'Coordinates records, communication, and member updates.',
    photo_url: '',
    order_index: 3,
  },
  {
    name: 'Prof. R. Deshpande',
    role: 'Treasurer',
    bio: 'Oversees finance and association planning.',
    photo_url: '',
    order_index: 4,
  },
];

function Dashboard() {
  const [role] = useState(() => localStorage.getItem('role') || 'User');
  const [executives, setExecutives] = useState(DEFAULT_EXECUTIVES);
  const [executiveForm, setExecutiveForm] = useState(DEFAULT_EXECUTIVES);
  const [executiveMessage, setExecutiveMessage] = useState('');
  const [executiveSaving, setExecutiveSaving] = useState(false);
  const [memberTable, setMemberTable] = useState([]);
  const [memberTableLoading, setMemberTableLoading] = useState(false);
  const [memberTableError, setMemberTableError] = useState('');
  const [memberFilters, setMemberFilters] = useState({
    search: '',
    year: '',
    role: '',
    page: 1,
    limit: 12,
  });
  const [memberMeta, setMemberMeta] = useState({
    total: 0,
    totalPages: 1,
  });

  const yearOptions = useMemo(() => Array.from({ length: 2030 - 1970 + 1 }, (_, index) => 1970 + index), []);

  // ── Create User state ──
  const [createUserForm, setCreateUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Student',
    course: '',
    batch_mode: 'year',
    batch_year: '2020',
    batch_start_year: '2020',
    batch_end_year: '2022',
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState('');
  const [createUserMessageType, setCreateUserMessageType] = useState('success');
  const [createdUser, setCreatedUser] = useState(null);

  const navigate = useNavigate();
  const executiveRefs = useRef([]);
  const galleryPhotos = useMemo(
    () => [
      { title: 'Convocation Day', subtitle: 'Campus celebration' },
      { title: 'Alumni Reunion', subtitle: 'Candid moments' },
      { title: 'Scholarship Drive', subtitle: 'Community impact' },
      { title: 'Career Panel', subtitle: 'Industry insights' },
      { title: 'Cultural Night', subtitle: 'Performance highlights' },
      { title: 'Annual Meetup', subtitle: 'Networking snapshots' },
    ],
    []
  );

  useEffect(() => {
    const nodes = executiveRefs.current.filter(Boolean);
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [executives]);

  useEffect(() => {
    const loadExecutives = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(apiUrl('/api/admin/executives'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setExecutives(data);
          setExecutiveForm(
            data.map((member) => ({
              name: member.name || '',
              role: member.role || '',
              bio: member.bio || '',
              photo_url: member.photo_url || '',
              order_index: member.order_index ?? '',
            }))
          );
        }
      } catch {
        setExecutiveForm(DEFAULT_EXECUTIVES);
      }
    };

    void loadExecutives();
  }, []);

  useEffect(() => {
    if (!['Admin', 'admin'].includes(role)) return undefined;

    const controller = new AbortController();
    const loadMembersTable = async () => {
      setMemberTableLoading(true);
      setMemberTableError('');

      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          page: String(memberFilters.page),
          limit: String(memberFilters.limit),
        });

        if (memberFilters.search.trim()) params.set('search', memberFilters.search.trim());
        if (memberFilters.year.trim()) params.set('year', memberFilters.year.trim());
        if (memberFilters.role.trim()) params.set('role', memberFilters.role.trim());

        const response = await fetch(apiUrl(`/api/admin/users-table?${params.toString()}`), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok) {
          setMemberTable(data.data || []);
          setMemberMeta({
            total: data.total || 0,
            totalPages: data.totalPages || 1,
          });
        } else {
          setMemberTableError(data.message || 'Failed to load members table.');
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMemberTableError('Failed to load members table.');
        }
      }

      setMemberTableLoading(false);
    };

    void loadMembersTable();
    return () => controller.abort();
  }, [role, memberFilters.page, memberFilters.limit, memberFilters.search, memberFilters.year, memberFilters.role]);

  const isAdmin = ['Admin', 'admin'].includes(role);

  const handleExecutiveChange = (index, field, value) => {
    setExecutiveForm((prev) =>
      prev.map((member, currentIndex) =>
        currentIndex === index ? { ...member, [field]: value } : member
      )
    );
  };

  const addExecutiveMember = () => {
    setExecutiveForm((prev) => [
      ...prev,
      { name: '', role: '', bio: '', photo_url: '', order_index: prev.length + 1 },
    ]);
  };

  const removeExecutiveMember = (index) => {
    setExecutiveForm((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const saveExecutiveMembers = async (e) => {
    e.preventDefault();
    setExecutiveSaving(true);
    setExecutiveMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/admin/executives'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ members: executiveForm }),
      });

      const data = await response.json();
      if (response.ok) {
        setExecutiveMessage(data.message || 'Executive members updated successfully.');
        const refreshed = executiveForm
          .filter((member) => member.name.trim() && member.role.trim())
          .map((member, index) => ({
            ...member,
            order_index: Number(member.order_index) || index + 1,
          }))
          .sort((a, b) => Number(a.order_index) - Number(b.order_index));
        setExecutives(refreshed);
      } else {
        setExecutiveMessage(data.message || 'Failed to update executive members.');
      }
    } catch {
      setExecutiveMessage('Error saving executive members.');
    }

    setExecutiveSaving(false);
  };

  const handleMemberFilterChange = (e) => {
    const { name, value } = e.target;
    setMemberFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const goToMembersPage = (nextPage) => {
    setMemberFilters((prev) => ({
      ...prev,
      page: nextPage,
    }));
  };

  // ── Create User handler ──
  const handleCreateUserChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'batch_mode') {
      setCreateUserForm((prev) => ({ ...prev, batch_mode: value }));
      return;
    }

    if (name === 'batch_start_year') {
      setCreateUserForm((prev) => ({
        ...prev,
        batch_start_year: value,
        batch_end_year: Number(prev.batch_end_year) < Number(value) ? value : prev.batch_end_year,
      }));
      return;
    }

    if (name === 'batch_end_year') {
      setCreateUserForm((prev) => ({
        ...prev,
        batch_end_year: value,
        batch_start_year: Number(value) < Number(prev.batch_start_year) ? value : prev.batch_start_year,
      }));
      return;
    }

    setCreateUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const formatBatchLabel = () => {
    if (createUserForm.batch_mode === 'year') {
      return createUserForm.batch_year;
    }
    const start = Number(createUserForm.batch_start_year);
    const end = Number(createUserForm.batch_end_year);
    if (!start || !end) return '';
    if (start === end) return String(start);
    const endSuffix = String(end).slice(-2);
    const sameCentury = Math.floor(start / 100) === Math.floor(end / 100);
    return sameCentury ? `${start}-${endSuffix}` : `${start}-${end}`;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setCreateUserMessage('');
    setCreatedUser(null);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...createUserForm,
        batch_type: createUserForm.batch_mode,
        graduation_year: createUserForm.batch_mode === 'year' ? createUserForm.batch_year : createUserForm.batch_start_year,
        batch_label: formatBatchLabel(),
      };

      const response = await fetch(apiUrl('/api/admin/create-user'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setCreateUserMessageType('success');
        setCreateUserMessage(data.message || 'User created successfully!');
        setCreatedUser(data.user);
        setCreateUserForm({
          full_name: '',
          email: '',
          password: '',
          role: 'Student',
          course: '',
          batch_mode: 'year',
          batch_year: '2020',
          batch_start_year: '2020',
          batch_end_year: '2022',
        });
        // Refresh the members table
        setMemberFilters((prev) => ({ ...prev, page: 1 }));
      } else {
        setCreateUserMessageType('error');
        setCreateUserMessage(data.message || 'Failed to create user.');
      }
    } catch {
      setCreateUserMessageType('error');
      setCreateUserMessage('Error connecting to the server.');
    }

    setCreateUserLoading(false);
  };

  return (
    <>
      <h1 className="page-title">Welcome back, {role}!</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Alumni</h3>
          <div className="value">1,245</div>
        </div>
        <div className="stat-card">
          <h3>Active Jobs</h3>
          <div className="value">34</div>
        </div>
        <div className="stat-card">
          <h3>Upcoming Events</h3>
          <div className="value">5</div>
        </div>
        <div className="stat-card">
          <h3>Network Growth</h3>
          <div className="value">+12%</div>
        </div>
      </div>

      <div className="content-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button className="primary-btn action-btn" onClick={() => navigate('/directory')}>Browse Directory</button>
          <button className="primary-btn action-btn" onClick={() => navigate('/jobs')}>Find Opportunities</button>
          <button className="primary-btn action-btn" onClick={() => navigate('/profile')}>Update Profile</button>
        </div>
      </div>

      {isAdmin && (
        <>
          {/* ── Admin: Create User Profile ── */}
          <section className="content-card dashboard-section admin-create-user-section">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">Admin tools</p>
                <h2>Create User Profile</h2>
              </div>
              <p className="section-copy">
                Register new alumni, professors or admin users. A unique Member ID (KUCAAD-XXXX) will be auto-generated.
              </p>
            </div>

            <form className="create-user-form" onSubmit={handleCreateUser}>
              <div className="create-user-grid">
                <input
                  name="full_name"
                  className="input-field"
                  placeholder="Full Name *"
                  value={createUserForm.full_name}
                  onChange={handleCreateUserChange}
                  required
                />
                <input
                  name="email"
                  type="email"
                  className="input-field"
                  placeholder="Email Address *"
                  value={createUserForm.email}
                  onChange={handleCreateUserChange}
                  required
                />
                <input
                  name="password"
                  type="password"
                  className="input-field"
                  placeholder="Temporary Password *"
                  value={createUserForm.password}
                  onChange={handleCreateUserChange}
                  required
                  minLength="6"
                />
                <select
                  name="role"
                  className="input-field"
                  value={createUserForm.role}
                  onChange={handleCreateUserChange}
                >
                  <option value="Student">Student</option>
                  <option value="Professor">Professor</option>
                  <option value="Executive Member">Executive Member</option>
                  <option value="Admin">Admin</option>
                </select>
                <select
                  name="course"
                  className="input-field"
                  value={createUserForm.course}
                  onChange={handleCreateUserChange}
                >
                  <option value="">Select Course</option>
                  <option value="M.Com">M.Com</option>
                  <option value="M.Phil">M.Phil</option>
                  <option value="Ph.D">Ph.D</option>
                  <option value="Faculty Member">Faculty Member</option>
                  <option value="PGDEF">PGDEF</option>
                </select>
              </div>

              <div className="profile-batch-panel" style={{ marginTop: '16px' }}>
                <div className="profile-batch-switch">
                  <button
                    type="button"
                    className={`profile-switch-btn ${createUserForm.batch_mode === 'year' ? 'active' : ''}`}
                    onClick={() => handleCreateUserChange({ target: { name: 'batch_mode', value: 'year' } })}
                  >
                    Particular Year
                  </button>
                  <button
                    type="button"
                    className={`profile-switch-btn ${createUserForm.batch_mode === 'range' ? 'active' : ''}`}
                    onClick={() => handleCreateUserChange({ target: { name: 'batch_mode', value: 'range' } })}
                  >
                    Batch Range
                  </button>
                </div>

                {createUserForm.batch_mode === 'year' ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Batch / Year</label>
                    <select name="batch_year" className="input-field" value={createUserForm.batch_year} onChange={handleCreateUserChange} required>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="profile-batch-range">
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start Year</label>
                      <select name="batch_start_year" className="input-field" value={createUserForm.batch_start_year} onChange={handleCreateUserChange} required>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>End Year</label>
                      <select name="batch_end_year" className="input-field" value={createUserForm.batch_end_year} onChange={handleCreateUserChange} required>
                        {yearOptions
                          .filter((year) => year >= Number(createUserForm.batch_start_year))
                          .map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
                
                <div className="profile-batch-preview" style={{ marginTop: '16px' }}>
                  <span>Preview</span>
                  <strong>{formatBatchLabel() || 'Select a year or range'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px' }}>
                <button type="submit" className="primary-btn action-btn" disabled={createUserLoading}>
                  {createUserLoading ? 'Creating...' : '＋ Create User'}
                </button>
              </div>
            </form>

            {createUserMessage && (
              <div className={`create-user-message ${createUserMessageType}`}>
                <p>{createUserMessage}</p>
              </div>
            )}

            {createdUser && (
              <div className="created-user-card">
                <div className="created-user-badge">
                  <span className="created-user-id">{createdUser.member_id}</span>
                  <span className="created-user-role-tag">{createdUser.role}</span>
                </div>
                <div className="created-user-details">
                  <p><strong>Name:</strong> {createdUser.full_name}</p>
                  <p><strong>Email:</strong> {createdUser.email}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Share the Member ID and temporary password with the user. They can use either email or Member ID to log in.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── Admin: Members Table ── */}
          <section className="content-card dashboard-section admin-members-section">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">Admin tools</p>
                <h2>Members Table</h2>
              </div>
              <p className="section-copy">
                Live user and alumni details from SQL, with filters and pagination for easy management.
              </p>
            </div>

            <div className="admin-members-filters">
              <input
                name="search"
                className="input-field"
                placeholder="Search name, email, ID, course, company..."
                value={memberFilters.search}
                onChange={handleMemberFilterChange}
              />
              <input
                name="year"
                className="input-field"
                type="number"
                min="1970"
                max="2030"
                placeholder="Year"
                value={memberFilters.year}
                onChange={handleMemberFilterChange}
              />
              <select
                name="role"
                className="input-field"
                value={memberFilters.role}
                onChange={handleMemberFilterChange}
              >
                <option value="">All Roles</option>
                <option value="Student">Student</option>
                <option value="Professor">Professor</option>
                <option value="Executive Member">Executive Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {memberTableError && <p className="about-message">{memberTableError}</p>}

            <div className="admin-members-table-wrap">
              <table className="admin-members-table">
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Course</th>
                    <th>Batch/Year</th>
                    <th>Job</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {memberTableLoading ? (
                    <tr>
                      <td colSpan="8">Loading members...</td>
                    </tr>
                  ) : memberTable.length === 0 ? (
                    <tr>
                      <td colSpan="8">No members found for these filters.</td>
                    </tr>
                  ) : (
                    memberTable.map((member) => (
                      <tr key={member.id}>
                        <td><span className="member-id-badge">{member.member_id || '-'}</span></td>
                        <td>{member.full_name || '-'}</td>
                        <td>{member.email || '-'}</td>
                        <td>{member.role || '-'}</td>
                        <td>{member.course || '-'}</td>
                        <td>{member.batch_label || member.graduation_year || '-'}</td>
                        <td>{member.current_job || '-'}</td>
                        <td>{member.company || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-members-pagination">
              <span>
                Showing page {memberFilters.page} of {memberMeta.totalPages} ({memberMeta.total} records)
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="profile-switch-btn"
                  disabled={memberFilters.page <= 1}
                  onClick={() => goToMembersPage(memberFilters.page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="profile-switch-btn"
                  disabled={memberFilters.page >= memberMeta.totalPages}
                  onClick={() => goToMembersPage(memberFilters.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="content-card dashboard-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">Community showcase</p>
            <h2>Association Gallery</h2>
          </div>
          <p className="section-copy">
            A visual story of alumni milestones, campus memories, and the moments that keep the network alive.
          </p>
        </div>

        <div className="association-gallery">
          {galleryPhotos.map((photo, index) => (
            <article key={photo.title} className="gallery-card">
              <div className="gallery-image">
                <div className="gallery-badge">0{index + 1}</div>
                <div className="gallery-orb gallery-orb-a" />
                <div className="gallery-orb gallery-orb-b" />
                <span className="gallery-icon">[]</span>
              </div>
              <div className="gallery-meta">
                <h3>{photo.title}</h3>
                <p>{photo.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-card dashboard-section executive-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">Leadership spotlight</p>
            <h2>Executive Member Profiles</h2>
          </div>
          <p className="section-copy">
            Scroll down to reveal the people guiding the association and keeping the alumni community connected.
          </p>
        </div>

        {isAdmin && (
          <form className="executive-edit-form" onSubmit={saveExecutiveMembers}>
            <div className="about-edit-header">
              <div>
                <p className="section-eyebrow">Admin edit mode</p>
                <h3>Manage Executive Members</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type="button" className="profile-switch-btn" onClick={addExecutiveMember}>
                  Add Member
                </button>
                <button type="submit" className="primary-btn action-btn" disabled={executiveSaving}>
                  {executiveSaving ? 'Saving...' : 'Save Committee'}
                </button>
              </div>
            </div>

            <div className="executive-edit-list">
              {executiveForm.map((member, index) => (
                <div key={`${member.name || 'member'}-${index}`} className="executive-edit-card">
                  <div className="executive-edit-card-head">
                    <strong>Member {index + 1}</strong>
                    <button
                      type="button"
                      className="profile-switch-btn"
                      onClick={() => removeExecutiveMember(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="executive-edit-grid">
                    <input
                      className="input-field"
                      placeholder="Name"
                      value={member.name}
                      onChange={(e) => handleExecutiveChange(index, 'name', e.target.value)}
                    />
                    <input
                      className="input-field"
                      placeholder="Role"
                      value={member.role}
                      onChange={(e) => handleExecutiveChange(index, 'role', e.target.value)}
                    />
                    <input
                      className="input-field"
                      placeholder="Photo URL"
                      value={member.photo_url}
                      onChange={(e) => handleExecutiveChange(index, 'photo_url', e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Order"
                      value={member.order_index}
                      onChange={(e) => handleExecutiveChange(index, 'order_index', e.target.value)}
                    />
                    <textarea
                      className="input-field"
                      placeholder="Short bio"
                      rows="3"
                      value={member.bio}
                      onChange={(e) => handleExecutiveChange(index, 'bio', e.target.value)}
                      style={{ gridColumn: '1 / -1', resize: 'vertical' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {executiveMessage && <p className="about-message">{executiveMessage}</p>}
          </form>
        )}

        <div className="executive-grid">
          {executives.map((member, index) => (
            <article
              key={`${member.name}-${member.role}-${index}`}
              ref={(node) => {
                executiveRefs.current[index] = node;
              }}
              className="executive-card scroll-reveal"
            >
              <div className="executive-avatar executive-avatar-photo" aria-hidden="true">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.name} />
                ) : (
                  member.name
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                )}
              </div>
              <div className="executive-meta">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                {member.bio && <span>{member.bio}</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default Dashboard;
