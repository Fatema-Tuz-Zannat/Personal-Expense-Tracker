import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const isPasswordValid = (password) => {
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isPasswordValid(password)) {
      setErrorMessage('Password must be at least 8 characters long and include at least one number and one special character.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        uid,
        firstName,
        lastName,
        email,
      });

      alert('Signup successful!');
      navigate('/login');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak.');
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
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
        className="border p-2 rounded"
      />
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
