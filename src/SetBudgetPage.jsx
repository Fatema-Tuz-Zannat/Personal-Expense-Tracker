import React, { useState } from 'react';
import { db } from './firebase'; 

const SetBudgetPage = () => {
  const [type, setType] = useState('monthly || yearly');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid budget amount.');
      return;
    }

    const period = type === 'monthly' ? month : year;

    try {
      await addDoc(collection(db, 'budgets', currentUser.uid, 'budgetEntries'), {
        type,
        period,
        amount: parseFloat(amount),
      });
      alert('Budget set successfully!');
    } catch (err) {
      console.error(err);
      alert('Error setting budget.');
    }
  };

  return (
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
  );
};

export default SetBudgetPage;
