import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) return;

      const expensesRef = collection(db, 'expenses');
      const q = query(expensesRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const expensesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExpenses(expensesData);
    };

    fetchExpenses();
  }, [user]);

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.email}!</h1>

      <div className="bg-white shadow-md rounded p-6 w-full max-w-md space-y-4">
        <p className="text-lg">Total Expenses: <span className="font-semibold">{expenses.length}</span></p>
        <p className="text-lg">Total Amount Spent: <span className="font-semibold">₹{totalAmount.toFixed(2)}</span></p>

        <button
          onClick={() => navigate('/expenses')}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          View Expenses
        </button>
        <button
          onClick={() => navigate('/add-income')}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Add Income
        </button>
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 mt-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
