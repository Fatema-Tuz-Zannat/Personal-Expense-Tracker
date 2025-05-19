import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import ExpenseTracker from './ExpenseTracker';
import Dashboard from './Dashboard';
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import IncomeTracker from './IncomeTracker'; 
import SetBudgetPage from './SetBudgetPage';
import AddExpenseForm from "./AddExpenseForm";
import UserProfile from './UserProfile';
import AdminDashboard from './AdminDashboard';

const ADMIN_EMAIL = 'adminemail@gmail.com';

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
          element={
            !user ? (
              <Navigate to="/login" />
            ) : user.email === ADMIN_EMAIL ? (
              <Navigate to="/admin" />
            ) : (
              <Dashboard />
            )
          }
        />

        <Route
          path="/admin"
          element={
            user && user.email === ADMIN_EMAIL ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/income"
          element={user ? <IncomeTracker /> : <Navigate to="/login" />}
        />
        <Route
          path="/expenses"
          element={user ? <ExpenseTracker /> : <Navigate to="/login" />}
        />
        <Route
          path="/budgets"
          element={user ? <SetBudgetPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <UserProfile /> : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route path="/add-expense" element={<AddExpenseForm />} />
      </Routes>
    </Router>
  );
}


export default App;
