import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const fetchExpenses = useCallback(async () => {
    const q = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExpenses(data);
  }, [user]);

  const fetchIncomes = useCallback(async () => {
    const q = query(collection(db, 'income'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setIncomes(data);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchIncomes();
    }
  }, [fetchExpenses, fetchIncomes, user]);

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const remaining = totalIncome - totalExpense;

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.email}!</h1>

      <div className="bg-white p-6 rounded shadow-md w-full max-w-md space-y-4">
        <p><strong>Total Income:</strong> TK {totalIncome.toFixed(2)}</p>
        <p><strong>Total Expenses:</strong> TK {totalExpense.toFixed(2)}</p>
        <p><strong>Remaining Income:</strong> TK {remaining.toFixed(2)}</p>

        <div className="flex gap-2">
          <button onClick={() => navigate('/income')} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Add/View Income
          </button>
          <button onClick={() => navigate('/expenses')} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Add/View Expense
          </button>
          <button onClick={() => navigate('/budgets')} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Set Budget
          </button>
        </div>
        <button onClick={handleLogout} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 mt-2">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
