import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../lib/api';
import '../App.css';

function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, full_name: formData.fullName })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('OTP sent to your email!');
        setStep(2);
      } else {
        setMessage(data.message || 'Failed to send OTP');
      }
    } catch {
      setMessage('Error connecting to the server');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('OTP verified! Please create a password.');
        setStep(3);
      } else {
        setMessage(data.message || 'Invalid OTP');
      }
    } catch {
      setMessage('Error connecting to the server');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords don't match!");
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password, full_name: formData.fullName })
      });
      const data = await response.json();
      if (response.ok) {
        const idMsg = data.member_id ? ` Your Member ID is: ${data.member_id}` : '';
        setMessage(`Registration successful!${idMsg} Redirecting to login...`);
        setTimeout(() => navigate('/login'), 3500);
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch {
      setMessage('Error connecting to the server');
    }
    setLoading(false);
  };

  return (
    <div className="auth-card">
      <h2 style={{ marginBottom: '8px', color: 'var(--text-main)' }}>Join KUCAAD</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Create Alumni/Professor Account</p>
      
      {step === 1 && (
        <form onSubmit={handleSendOTP}>
          <input type="text" name="fullName" className="input-field" placeholder="Full Name" value={formData.fullName} onChange={handleChange} required />
          <input type="email" name="email" className="input-field" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOTP}>
          <p style={{ fontSize: '0.9em', marginBottom: '16px', color: 'var(--text-muted)' }}>OTP sent to <strong>{formData.email}</strong></p>
          <input type="text" name="otp" className="input-field" placeholder="Enter 6-digit OTP" value={formData.otp} onChange={handleChange} required maxLength="6" />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button type="button" style={{ marginTop: '16px', background: 'transparent', border: 'none', color: 'var(--accent-blue)', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setStep(1)}>
            Change Email
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleRegister}>
          <input type="password" name="password" className="input-field" placeholder="Create Password" value={formData.password} onChange={handleChange} required minLength="6" />
          <input type="password" name="confirmPassword" className="input-field" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required minLength="6" />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>
      )}

      {message && <p style={{ marginTop: '16px', fontWeight: '500', color: message.includes('failed') || message.includes('Error') ? '#ef4444' : '#22c55e' }}>{message}</p>}
      
      <p style={{ marginTop: '24px', color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: '500' }}>Login</Link>
      </p>
    </div>
  );
}

export default Register;
