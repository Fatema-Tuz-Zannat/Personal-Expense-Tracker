import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchIncome = async () => {
      const q = query(collection(db, 'incomes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const total = snapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (parseFloat(data.amount) || 0);
      }, 0);
      setTotalIncome(total);
    };

    const fetchExpenses = async () => {
      const q = query(collection(db, 'expenses'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const total = snapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (parseFloat(data.amount) || 0);
      }, 0);
      setTotalExpenses(total);
    };

    fetchIncome();
    fetchExpenses();
  }, [user]);

  const remainingIncome = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.email}</h1>

      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md space-y-4">
        <div className="text-lg">
          <p className="mb-2">💰 <strong>Total Income:</strong> TK{totalIncome.toFixed(2)}</p>
          <p className="mb-2">🧾 <strong>Total Expenses:</strong> TK{totalExpenses.toFixed(2)}</p>
          <p className="mb-2">💼 <strong>Remaining Income:</strong> TK{remainingIncome.toFixed(2)}</p>
        </div>

        <div className="flex flex-col space-y-2">
          <button
            onClick={() => navigate('/income')}
            className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            ➕ Add/View Income
          </button>

          <button
            onClick={() => navigate('/expenses')}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            ➕ Add/View Expenses
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
