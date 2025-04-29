import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import ExpenseTracker from './ExpenseTracker';
import AddIncome from './AddIncome';
import Dashboard from './Dashboard';
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/expenses"
          element={user ? <ExpenseTracker /> : <Navigate to="/login" />}
        />
        <Route
          path="/add-income"
          element={user ? <AddIncome /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
