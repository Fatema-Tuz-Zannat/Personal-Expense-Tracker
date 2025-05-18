import React, { useState } from 'react';

const AddIncomeForm = ({ onAddIncome }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !amount || !date) {
      setError('Please fill in all fields.');
      setMessage('');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be a positive whole number.');
      setMessage('');
      return;
    }

    const incomeData = {
      title,
      amount: parsedAmount,
      date: new Date(date),
    };

    onAddIncome(incomeData);

    setTitle('');
    setAmount('');
    setDate('');
    setError('');
    setMessage('Income added successfully!');

    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white shadow-md rounded-md space-y-4"
    >
      <h2 className="text-xl font-bold text-center">Add New Income</h2>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      {message && <p className="text-green-600 text-sm text-center">{message}</p>}

      <input
        type="text"
        placeholder="Source"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded p-2"
      />

      <input
        type="number"
        placeholder="Amount (TK)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border rounded p-2"
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border rounded p-2"
      />

      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
      >
        Add Income
      </button>
    </form>
  );
};

export default AddIncomeForm;
