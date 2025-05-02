import React, { useState } from 'react';
import { db, auth } from './firebase'; 
import { addDoc, collection } from 'firebase/firestore';

const SetBudgetPage = () => {
  const [type, setType] = useState('monthly' || 'yearly');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid budget amount.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert('User not authenticated.');
      return;
    }

    const period = type === 'monthly' ? month : year;

    try {
      await addDoc(
        collection(db, 'budgets', currentUser.uid, 'budgetEntries'),
        {
          type,
          period,
          amount: parseFloat(amount),
        }
      );
      alert('Budget set successfully!');
      setAmount('');
      setMonth('');
      setYear('');
    } catch (err) {
      console.error(err);
      alert('Error setting budget.');
    }
  };

  return (
    <div className="set-budget-page">
      <h2>Set Your Budget</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Budget Type:
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>

        {type === 'monthly' && (
          <label>
            Month:
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </label>
        )}

        {type === 'yearly' && (
          <label>
            Year:
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2025"
              required
            />
          </label>
        )}

        <label>
          Amount (in TK):
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <button type="submit">Set Budget</button>
      </form>
    </div>
  );
};

export default SetBudgetPage;
