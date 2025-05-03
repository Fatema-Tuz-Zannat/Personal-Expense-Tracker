import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getCurrentMonthYear } from './dateHelpers';

const AddExpenseForm = ({ onExpenseAdded }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [budget, setBudget] = useState(null);

  const currentUser = auth.currentUser;
  const { currentMonth, currentYear } = getCurrentMonthYear();

  useEffect(() => {
    const fetchBudget = async () => {
      const budgetRef = collection(db, 'budgets');
      const q = query(budgetRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      let monthlyBudget = null;
      let yearlyBudget = null;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'monthly' && data.month === currentMonth && data.year === currentYear) {
          monthlyBudget = data.amount;
        } else if (data.type === 'yearly' && data.year === currentYear) {
          yearlyBudget = data.amount;
        }
      });

      setBudget(monthlyBudget || yearlyBudget || null);
    };

    fetchBudget();
  }, [currentUser.uid, currentMonth, currentYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !amount || !date) {
      alert('Please fill in all fields.');
      return;
    }

    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    let totalMonthlyExpenses = 0;

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const docDate = new Date(data.date);
      if (
        docDate.getMonth() + 1 === month &&
        docDate.getFullYear() === year
      ) {
        totalMonthlyExpenses += parseFloat(data.amount);
      }
    });

    const newTotal = totalMonthlyExpenses + parseFloat(amount);
    const budgetLimit = budget || 0;
    const usagePercentage = ((newTotal / budgetLimit) * 100).toFixed(2);

    if (budgetLimit > 0 && newTotal > 0.7 * budgetLimit) {
      const confirmAdd = window.confirm(
        `Warning: Adding this expense will exceed 70% of your monthly budget (${usagePercentage}%). Continue?`
      );
      if (!confirmAdd) return;
    }

    await addDoc(expensesRef, {
      title,
      amount: parseFloat(amount),
      date,
      userId: currentUser.uid
    });

    setTitle('');
    setAmount('');
    setDate('');
    onExpenseAdded();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Expense</h3>
      <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button type="submit">Add Expense</button>
    </form>
  );
};

export default AddExpenseForm;
