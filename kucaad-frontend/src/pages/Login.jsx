import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../lib/api';
import '../App.css';

function Login() {
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'member_id'
  const [email, setEmail] = useState('');
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error'); // 'error' or 'success'
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const body = { password };
      if (loginMode === 'member_id') {
        body.member_id = memberId;
      } else {
        body.email = email;
      }

      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        if (data.member_id) {
          localStorage.setItem('member_id', data.member_id);
        }
        setMessageType('success');
        setMessage(`Welcome back! Your Member ID: ${data.member_id || 'N/A'}`);
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        setMessageType('error');
        setMessage(data.message || 'Login failed');
      }
    } catch {
      setMessageType('error');
      setMessage('Error connecting to the server');
    }
  };

  return (
    <div className="auth-card">
      <h2 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>KUCAAD Login</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Alumni Directory Access</p>

      {/* Login mode toggle */}
      <div className="login-mode-toggle" style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: 'var(--bg-muted)',
        borderRadius: '10px',
        padding: '4px'
      }}>
        <button
          type="button"
          onClick={() => setLoginMode('email')}
          className={loginMode === 'email' ? 'login-toggle-active' : 'login-toggle-inactive'}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            background: loginMode === 'email'
              ? 'linear-gradient(135deg, var(--kud-secondary) 0%, #007acc 100%)'
              : 'transparent',
            color: loginMode === 'email' ? '#fff' : 'var(--text-muted)',
            boxShadow: loginMode === 'email' ? '0 2px 8px rgba(0, 153, 255, 0.3)' : 'none'
          }}
        >
          📧 Email
        </button>
        <button
          type="button"
          onClick={() => setLoginMode('member_id')}
          className={loginMode === 'member_id' ? 'login-toggle-active' : 'login-toggle-inactive'}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            background: loginMode === 'member_id'
              ? 'linear-gradient(135deg, var(--kud-gold) 0%, var(--kud-gold-dark) 100%)'
              : 'transparent',
            color: loginMode === 'member_id' ? 'var(--kud-primary-dark)' : 'var(--text-muted)',
            boxShadow: loginMode === 'member_id' ? '0 2px 8px rgba(212, 175, 55, 0.3)' : 'none'
          }}
        >
          🆔 Member ID
        </button>
      </div>

      <form onSubmit={handleLogin}>
        {loginMode === 'email' ? (
          <input
            type="email"
            className="input-field"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        ) : (
          <input
            type="text"
            className="input-field"
            placeholder="Member ID (e.g. KUCAAD-0001)"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value.toUpperCase())}
            required
          />
        )}
        <input
          type="password"
          className="input-field"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="primary-btn">Login</button>
      </form>

      {message && (
        <p style={{
          marginTop: '16px',
          fontWeight: 500,
          color: messageType === 'success' ? '#22c55e' : '#ef4444',
          padding: '10px 16px',
          borderRadius: '8px',
          background: messageType === 'success' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${messageType === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          fontSize: '0.9rem'
        }}>
          {message}
        </p>
      )}
      <p style={{ marginTop: '24px', color: 'var(--text-muted)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '500' }}>Register</Link>
      </p>
    </div>
  );
}

export default Login;
