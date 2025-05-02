import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#00C49F', '#FF8042'];

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [budget, setBudget] = useState(null);
  const [budgetType, setBudgetType] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setCurrentUser(user);
        fetchData(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async (uid) => {
    const expenseSnapshot = await getDocs(query(collection(db, 'expenses'), where('userId', '==', uid)));
    const incomeSnapshot = await getDocs(query(collection(db, 'incomes'), where('userId', '==', uid)));
    const budgetSnapshot = await getDocs(query(collection(db, 'budgets'), where('userId', '==', uid)));

    let expenses = 0;
    expenseSnapshot.forEach(doc => expenses += parseFloat(doc.data().amount));

    let income = 0;
    incomeSnapshot.forEach(doc => income += parseFloat(doc.data().amount));

    let budgetData = null;
    let type = '';
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    budgetSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'monthly' && data.month === currentMonth && data.year === currentYear) {
        budgetData = data;
        type = 'monthly';
      } else if (data.type === 'yearly' && data.year === currentYear && !budgetData) {
        budgetData = data;
        type = 'yearly';
      }
    });

    setTotalExpenses(expenses);
    setTotalIncome(income);
    setBudget(budgetData ? budgetData.amount : null);
    setBudgetType(type);
  };

  const budgetUsage = budget ? ((totalExpenses / budget) * 100).toFixed(2) : 0;
  const remainingIncome = (totalIncome - totalExpenses).toFixed(2);

  const pieData = [
    { name: 'Expenses', value: totalExpenses },
    { name: 'Remaining Income', value: totalIncome - totalExpenses },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="mb-6 space-y-2">
        <p><strong>Budget ({budgetType}):</strong> TK {budget ?? 'Not Set'}</p>
        <p><strong>Total Income:</strong> TK {totalIncome.toFixed(2)}</p>
        <p><strong>Total Expenses:</strong> TK {totalExpenses.toFixed(2)}</p>
        <p><strong>Remaining Income:</strong> TK {remainingIncome}</p>
      </div>

      {budget && (
        <div className="mb-6">
          <p className="mb-1 font-medium">Budget Usage:</p>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${budgetUsage > 100 ? 100 : budgetUsage}%` }}
            />
          </div>
          <p className="text-sm mt-1">{budgetUsage}% used</p>
        </div>
      )}

      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
