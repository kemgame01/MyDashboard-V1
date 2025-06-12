import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InputField from '../components/InputField';
import { loginUser } from '../services/authService';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/Login.css'; // Your animated background styles

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginUser(email, password);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError('Failed to login. Please check your credentials.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="login-body">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    // This outer div still uses your animated background
    <div className="login-body">
      {/* --- MODIFIED: Changed to a solid white card with a stronger shadow --- */}
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
        {/* --- MODIFIED: Text color changed to dark gray --- */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Login to Dashboard</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} autoComplete="on">
          <InputField
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <InputField
            label="Password"
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            // --- MODIFIED: Adjusted button style for better contrast on white ---
            className={`w-full bg-blue-600 text-white py-2 rounded-lg mt-4 transition font-semibold ${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"}`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* --- MODIFIED: Text color changed for readability --- */}
        <p className="text-gray-600 text-center mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-500 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;