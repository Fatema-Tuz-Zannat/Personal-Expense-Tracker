import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import './Sign.css';
import backgroundImage from './backgrounds/signupbackground.png';
import logo from './backgrounds/logo.png';

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
    <div
      className="signup-page"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="top-left-logo">
        <img src={logo} alt="Logo" />
      </div>

      <div className="signup-form-container">
        <div className="logo-subtext">Please Enter:</div>

        <form onSubmit={handleSignup}>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Signup</button>

          <div className="signup-link">
            <Link to="/login" className="signup-button">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
