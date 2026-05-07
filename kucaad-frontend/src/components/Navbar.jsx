import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../lib/api';

/* ── inline styles keep the Navbar self-contained ── */
const S = {
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--navbar-height)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    background: 'linear-gradient(90deg, var(--kud-primary-dark) 0%, var(--kud-primary) 60%, #00305e 100%)',
    borderBottom: '1px solid rgba(0,153,255,0.18)',
    boxShadow: '0 2px 24px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },

  /* left: logo + wordmark */
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    textDecoration: 'none',
    userSelect: 'none',
  },
  logoWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%)',
    border: '1.5px solid rgba(212,175,55,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '0 0 14px rgba(212,175,55,0.2)',
    position: 'relative',
  },
  logoInner: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.1rem',
    fontWeight: 800,
    color: 'var(--kud-gold)',
    letterSpacing: '-0.5px',
    lineHeight: 1,
  },
  wordmark: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
  },
  wordmarkTop: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: '1.05rem',
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '0.5px',
  },
  wordmarkSub: {
    fontSize: '0.65rem',
    fontWeight: 500,
    color: 'rgba(212,175,55,0.85)',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
  },

  /* centre: nav links */
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navLink: (active) => ({
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
    color: active ? '#fff' : 'rgba(255,255,255,0.65)',
    background: active
      ? 'linear-gradient(135deg, rgba(0,153,255,0.28), rgba(0,153,255,0.12))'
      : 'transparent',
    border: active ? '1px solid rgba(0,153,255,0.4)' : '1px solid transparent',
    boxShadow: active ? '0 0 12px rgba(0,153,255,0.2)' : 'none',
    transition: 'all 0.2s ease',
    letterSpacing: '0.2px',
    position: 'relative',
  }),

  /* right: user zone */
  rightZone: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  goldAccent: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--kud-gold)',
    boxShadow: '0 0 8px rgba(212,175,55,0.7)',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--kud-secondary) 0%, #005fa3 100%)',
    border: '2px solid rgba(212,175,55,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 0 10px rgba(0,153,255,0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  logoutBtn: {
    padding: '7px 15px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: 'transparent',
    border: '1px solid rgba(212,175,55,0.35)',
    color: 'rgba(212,175,55,0.9)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '0.3px',
  },
  notificationBtn: {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(212,175,55,0.35)',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    borderRadius: '999px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.68rem',
    fontWeight: 700,
    display: 'grid',
    placeItems: 'center',
  },

  /* mobile hamburger */
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '5px',
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    padding: 0,
  },
  hamburgerBar: {
    width: '20px',
    height: '2px',
    background: '#fff',
    borderRadius: '2px',
    transition: 'all 0.25s ease',
  },

  /* mobile dropdown */
  mobileMenu: (open) => ({
    position: 'fixed',
    top: 'var(--navbar-height)',
    left: 0,
    right: 0,
    background: 'linear-gradient(180deg, var(--kud-primary) 0%, var(--kud-primary-dark) 100%)',
    borderBottom: '1px solid rgba(0,153,255,0.18)',
    padding: open ? '16px 20px 20px' : '0 20px',
    maxHeight: open ? '300px' : '0',
    overflow: 'hidden',
    transition: 'all 0.32s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 99,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: open ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
  }),
  mobileLink: (active) => ({
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 600,
    textDecoration: 'none',
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
    background: active ? 'rgba(0,153,255,0.2)' : 'transparent',
    border: active ? '1px solid rgba(0,153,255,0.3)' : '1px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  }),
};

/* nav link items */
const NAV_LINKS = [
  { name: 'Home',     path: '/dashboard', icon: '🏠' },
  { name: 'Gallery',  path: '/gallery',   icon: '🖼️' },
  { name: 'Profiles', path: '/directory', icon: '👥' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  /* shadow on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) return undefined;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(apiUrl('/api/notifications?limit=6'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setNotifications(data.data || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Keep the current state if refresh fails.
      }
      setNotificationsLoading(false);
    };

    void loadNotifications();
    const interval = setInterval(() => {
      void loadNotifications();
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl('/api/notifications?limit=6'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Keep current state.
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(apiUrl(`/api/notifications/${notificationId}/read`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadNotifications();
    } catch {
      // Keep current state.
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(apiUrl('/api/notifications/read-all'), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadNotifications();
    } catch {
      // Keep current state.
    }
  };

  return (
    <>
      {/* ── Top Navbar bar ── */}
      <nav
        id="kucaad-navbar"
        key={location.pathname}
        style={{
          ...S.navbar,
          boxShadow: scrolled
            ? '0 4px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,153,255,0.12)'
            : S.navbar.boxShadow,
        }}
        aria-label="Main navigation"
      >
        {/* ── Brand / Logo ── */}
        <Link to="/dashboard" style={S.brand} aria-label="KUCAAD Home">
          <div style={S.logoWrap}>
            {/* University logo placeholder — swap <img> here when asset is ready */}
            <LogoPlaceholder />
          </div>
          <div style={S.wordmark}>
            <span style={S.wordmarkTop}>KUCAAD</span>
            <span style={S.wordmarkSub}>Alumni Portal</span>
          </div>
        </Link>

        {/* ── Desktop nav links ── */}
        <div style={S.navLinks} id="navbar-desktop-links">
          {NAV_LINKS.map(({ name, path }) => (
            <NavLink key={path} to={path} active={isActive(path)} label={name} />
          ))}
        </div>

        {/* ── Right zone ── */}
        <div style={S.rightZone}>
          <div style={S.goldAccent} aria-hidden="true" />

          {isLoggedIn ? (
            <>
              <button
                type="button"
                aria-label="Open notifications"
                aria-expanded={notificationOpen}
                onClick={() => {
                  setNotificationOpen((v) => !v);
                  if (!notificationOpen) {
                    void loadNotifications();
                  }
                }}
                style={S.notificationBtn}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={S.notificationBadge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              <div
                id="navbar-avatar"
                style={{
                  ...S.avatar,
                  transform: avatarHover ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: avatarHover
                    ? '0 0 18px rgba(0,153,255,0.5)'
                    : S.avatar.boxShadow,
                }}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={() => navigate('/profile')}
                title="My Profile"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
              >
                U
              </div>
              <button
                id="navbar-logout-btn"
                style={S.logoutBtn}
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(212,175,55,0.12)';
                  e.target.style.borderColor = 'var(--kud-gold)';
                  e.target.style.color = 'var(--kud-gold)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.borderColor = 'rgba(212,175,55,0.35)';
                  e.target.style.color = 'rgba(212,175,55,0.9)';
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                ...S.logoutBtn,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Sign In
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            id="navbar-mobile-menu-btn"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            style={{ ...S.hamburger, display: 'flex' }}
            className="navbar-hamburger"
          >
            <span
              style={{
                ...S.hamburgerBar,
                transform: mobileOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              }}
            />
            <span
              style={{
                ...S.hamburgerBar,
                opacity: mobileOpen ? 0 : 1,
                transform: mobileOpen ? 'scaleX(0)' : 'none',
              }}
            />
            <span
              style={{
                ...S.hamburgerBar,
                transform: mobileOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </nav>

      {/* ── Mobile dropdown ── */}
      {isLoggedIn && notificationOpen && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <div>
              <p className="section-eyebrow">Inbox</p>
              <h3>Notifications</h3>
            </div>
            <button
              type="button"
              className="profile-switch-btn"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          {notificationsLoading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notification-item ${item.read_at ? '' : 'unread'}`}
                  onClick={() => {
                    void markNotificationRead(item.id);
                    setNotificationOpen(false);
                  }}
                >
                  <div className="notification-item-top">
                    <strong>{item.title}</strong>
                    {!item.read_at && <span className="notification-dot" />}
                  </div>
                  <p>{item.message}</p>
                  <span className="notification-meta">
                    {item.priority ? `${item.priority} • ` : ''}
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        id="navbar-mobile-menu"
        style={S.mobileMenu(mobileOpen)}
        aria-hidden={!mobileOpen}
      >
        {NAV_LINKS.map(({ name, path, icon }) => (
          <Link
            key={path}
            to={path}
            style={S.mobileLink(isActive(path))}
            onClick={() => setMobileOpen(false)}
          >
            <span>{icon}</span>
            {name}
          </Link>
        ))}
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            style={{
              ...S.mobileLink(false),
              background: 'transparent',
              border: '1px solid rgba(212,175,55,0.2)',
              cursor: 'pointer',
              color: 'rgba(212,175,55,0.85)',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        )}
      </div>

      {/* Hide hamburger on desktop via media query injected once */}
      <NavbarStyles />
    </>
  );
}

/* ── Desktop nav link with hover effect ── */
function NavLink({ to, active, label }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      style={{
        ...S.navLink(active),
        ...(hovered && !active
          ? {
              color: '#fff',
              background: 'rgba(255,255,255,0.08)',
              borderColor: 'rgba(255,255,255,0.12)',
            }
          : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={active ? 'page' : undefined}
    >
      {label}
      {active && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-1px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '50%',
            height: '2px',
            background: 'var(--kud-gold)',
            borderRadius: '2px 2px 0 0',
          }}
        />
      )}
    </Link>
  );
}

/* ── University logo placeholder SVG ── */
function LogoPlaceholder() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield shape */}
      <path
        d="M14 2L4 6.5v7C4 18.8 8.4 23.6 14 26c5.6-2.4 10-7.2 10-12.5v-7L14 2z"
        fill="rgba(212,175,55,0.15)"
        stroke="#D4AF37"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Book lines */}
      <path d="M10 13h8M10 16h6M14 10v1" stroke="#D4AF37" strokeWidth="1.4" strokeLinecap="round" />
      {/* Star at top */}
      <circle cx="14" cy="9.5" r="1.2" fill="#D4AF37" />
    </svg>
  );
}

/* ── One-time style injection for responsive hamburger ── */
function NavbarStyles() {
  return (
    <style>{`
      .navbar-hamburger {
        display: none !important;
      }
      @media (max-width: 768px) {
        #navbar-desktop-links {
          display: none !important;
        }
        .navbar-hamburger {
          display: flex !important;
        }
        #navbar-logout-btn {
          display: none !important;
        }
      }
    `}</style>
  );
}
