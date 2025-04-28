import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { Link, useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(''); 
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setErrorMessage('No user found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setErrorMessage('Incorrect password.');
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col space-y-4">
      <h2 className="text-2xl font-bold mb-4">Login</h2>

      {errorMessage && <div className="text-red-500">{errorMessage}</div>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border p-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-600 text-white py-2 rounded">
        Login
      </button>

      <p className="mt-2">
        Don't have an account? <Link to="/signup" className="text-blue-600">Signup</Link>
      </p>
    </form>
  );
};

export default Login;
