import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error); 

      let msg = '';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            msg = 'No account found with this email.';
            break;
          case 'auth/wrong-password':
            msg = 'Incorrect password.';
            break;
          case 'auth/too-many-requests':
            msg = 'Too many failed attempts. Try again later.';
            break;
          case 'auth/invalid-email':
            msg = 'Invalid email format.';
            break;
          case 'auth/invalid-credential':
            msg = 'Invalid email or password.';
            break;
          default:
            msg = `Login failed: ${error.message || 'Unknown error.'}`;
        }
      } else {
        msg = 'Unexpected error occurred.';
      }

      setErrorMsg(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>

        <p className="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
