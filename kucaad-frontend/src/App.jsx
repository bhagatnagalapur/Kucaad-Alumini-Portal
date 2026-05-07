import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Profile   from './pages/Profile';
import Jobs      from './pages/Jobs';
import Events    from './pages/Events';
import Gallery   from './pages/Gallery';
import AboutUs   from './pages/AboutUs';
import Notices   from './pages/Notices';
import AdminDashboard from './pages/AdminDashboard';
import Layout    from './components/Layout';
import './App.css';

// Wraps a page with the Layout (sidebar + Navbar) and guards the route
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace />;
  return <Layout key={location.pathname}>{element}</Layout>;
};

// Guard for admin only routes
const AdminRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'Admin') return <Navigate to="/dashboard" replace />;
  return <Layout>{element}</Layout>;
};

function App() {
  return (
    <Routes>
      {/* Default → login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── Public Auth Routes ── */}
      <Route path="/login"    element={<div className="auth-layout"><Login    /></div>} />
      <Route path="/register" element={<div className="auth-layout"><Register /></div>} />

      {/* ── Protected Routes (inside Layout + Navbar) ── */}
      <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
      <Route path="/directory" element={<ProtectedRoute element={<Directory />} />} />
      <Route path="/profile"   element={<ProtectedRoute element={<Profile   />} />} />
      <Route path="/jobs"      element={<ProtectedRoute element={<Jobs      />} />} />
      <Route path="/events"    element={<ProtectedRoute element={<Events    />} />} />
      <Route path="/gallery"   element={<ProtectedRoute element={<Gallery   />} />} />
      <Route path="/about-us"  element={<ProtectedRoute element={<AboutUs   />} />} />
      <Route path="/notices"   element={<ProtectedRoute element={<Notices   />} />} />
      
      {/* ── Admin Only Routes ── */}
      <Route path="/admin"     element={<AdminRoute element={<AdminDashboard />} />} />
    </Routes>
  );
}

export default App;
