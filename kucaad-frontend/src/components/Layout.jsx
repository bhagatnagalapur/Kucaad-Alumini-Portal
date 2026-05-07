import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = localStorage.getItem('role'); // e.g., 'admin' or 'user'

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="app-layout-root">
      {/* Top Navigation */}
      <Navbar />

      <div className="app-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            Portal
          </div>
          <nav className="sidebar-nav">
            <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              🏠 Dashboard
            </Link>
            <Link to="/directory" className={`nav-item ${location.pathname === '/directory' ? 'active' : ''}`}>
              👥 Alumni Directory
            </Link>
            <Link to="/gallery" className={`nav-item ${location.pathname === '/gallery' ? 'active' : ''}`}>
              🖼️ Gallery
            </Link>
            <Link to="/jobs" className={`nav-item ${location.pathname === '/jobs' ? 'active' : ''}`}>
              💼 Job Board
            </Link>
            <Link to="/events" className={`nav-item ${location.pathname === '/events' ? 'active' : ''}`}>
              📅 Events
            </Link>
            <Link to="/notices" className={`nav-item ${location.pathname === '/notices' ? 'active' : ''}`}>
              🔔 Notices
            </Link>
            <Link to="/about-us" className={`nav-item ${location.pathname === '/about-us' ? 'active' : ''}`}>
              ℹ️ About Us
            </Link>
            
            {role === 'Admin' && (
              <>
                <hr style={{ margin: '10px 0', opacity: 0.1 }} />
                <Link to="/admin" className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}>
                  🛡️ Admin Panel
                </Link>
              </>
            )}

            <hr style={{ margin: '10px 0', opacity: 0.1 }} />
            <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
              👤 My Profile
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
