import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage(''); 
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Signup successful!');
      navigate('/login');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password should be at least 6 characters.');
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSignup} className="flex flex-col space-y-4">
      <h2 className="text-2xl font-bold mb-4">Signup</h2>

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
      <button type="submit" className="bg-green-600 text-white py-2 rounded">
        Signup
      </button>

      <p className="mt-2">
        Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
      </p>
    </form>
  );
};

export default Signup;
