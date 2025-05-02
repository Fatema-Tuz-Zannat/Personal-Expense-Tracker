import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const SetBudgetPage = () => {
  const [type, setType] = useState('monthly' || 'yearly');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [amount, setAmount] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchBudgets(user.uid);
      } else {
        setCurrentUser(null);
        setBudgets([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchBudgets = async (uid) => {
    const q = query(
      collection(db, 'budgets', uid, 'budgetEntries')
    );
    const querySnapshot = await getDocs(q);
    const budgetsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBudgets(budgetsData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid budget amount.');
      return;
    }

    const period = type === 'monthly' ? month : year;

    if (type === 'yearly') {
      const monthlyBudgets = budgets.filter(
        (b) => b.type === 'monthly' && b.period.startsWith(year)
      );
      const totalMonthly = monthlyBudgets.reduce(
        (sum, b) => sum + b.amount,
        0
      );

      if (parseFloat(amount) < totalMonthly) {
        const confirm = window.confirm(
          `You've already set monthly budgets totaling TK${totalMonthly}. Setting a yearly budget of TK${amount} will be less than the total monthly budgets. Do you still want to continue?`
        );
        if (!confirm) return;
      }
    }

    try {
      await addDoc(collection(db, 'budgets', currentUser.uid, 'budgetEntries'), {
        type,
        period,
        amount: parseFloat(amount),
      });
      alert('Budget set successfully!');
      fetchBudgets(currentUser.uid);
    } catch (err) {
      console.error(err);
      alert('Error setting budget.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'budgets', currentUser.uid, 'budgetEntries', id));
      alert('Budget deleted successfully!');
      fetchBudgets(currentUser.uid);
    } catch (err) {
      console.error(err);
      alert('Error deleting budget.');
    }
  };

  const handleEdit = async (id) => {
    const newAmount = prompt('Enter new budget amount:');
    if (newAmount && parseFloat(newAmount) > 0) {
      try {
        await updateDoc(doc(db, 'budgets', currentUser.uid, 'budgetEntries', id), {
          amount: parseFloat(newAmount),
        });
        alert('Budget updated successfully!');
        fetchBudgets(currentUser.uid);
      } catch (err) {
        console.error(err);
        alert('Error updating budget.');
      }
    } else {
      alert('Invalid amount entered.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Set Budget</h2>
        <label>
          What budget would you like to set?
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>

        {type === 'monthly' ? (
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
          />
        ) : (
          <input
            type="number"
            placeholder="Enter year (e.g. 2025)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        )}

        <input
          type="number"
          placeholder="Amount in TK"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <button type="submit">Save Budget</button>
      </form>

      <h3>Existing Budgets</h3>
      <ul>
        {budgets.map((budget) => (
          <li key={budget.id}>
            {budget.type} - {budget.period}: TK{budget.amount}
            <button onClick={() => handleEdit(budget.id)}>Edit</button>
            <button onClick={() => handleDelete(budget.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SetBudgetPage;
