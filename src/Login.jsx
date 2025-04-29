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
      switch (error.code) {
        case 'auth/user-not-found':
          setErrorMsg('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setErrorMsg('Incorrect password.');
          break;
        case 'auth/too-many-requests':
          setErrorMsg('Too many failed attempts. Please try again later.');
          break;
        case 'auth/invalid-credential':
          setErrorMsg('Invalid email or password.');
          break;
        default:
          setErrorMsg('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        {errorMsg && <p className="text-red-600 text-sm text-center">{errorMsg}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 w-full rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 w-full rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Login
        </button>
        <p className="text-center text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 underline">Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
