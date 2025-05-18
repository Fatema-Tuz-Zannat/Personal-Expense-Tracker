import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';
import backgroundImage from './backgrounds/loginbackground.png'; 
import logo from './backgrounds/logo.png'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email;

      if (userEmail === 'adminadmin@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      let msg = 'Login failed. Please try again.';

      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          msg = 'Invalid email or password.';
          break;
        case 'auth/too-many-requests':
          msg = 'Too many attempts. Please try again later.';
          break;
        default:
          msg = error.message;
      }

      setErrorMessage(msg);
    }
  };

return (
  <div
    className="login-page"
    style={{
      backgroundImage: `url(${backgroundImage})`,
    }}
  >
    <div className="top-left-logo">
      <img src={logo} alt="Logo" />
    </div>

    <div className="login-form-container">
      <div className="logo">
        <img src={logo} alt="App Logo" />
      </div>
      <div className="logo-subtext">Personal Expense Tracker</div>

      <form onSubmit={handleLogin}>
        <h2>Login</h2>
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
        <button type="submit">Login</button>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </form>

      <Link to="/signup">
        <button className="signup-button">Sign Up</button>
      </Link>
    </div>
  </div>
);

};

export default Login;
