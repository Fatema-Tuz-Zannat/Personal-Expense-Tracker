import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Signup from './Signup';
import Login from './Login';
import ExpenseTracker from './ExpenseTracker';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="App">
      {user ? (
        <>
          <button onClick={() => signOut(auth)}>Logout</button>
          <ExpenseTracker user={user} />
        </>
      ) : (
        <>
          <Signup />
          <Login onLogin={() => {}} />
        </>
      )}
    </div>
  );
}

export default App;
