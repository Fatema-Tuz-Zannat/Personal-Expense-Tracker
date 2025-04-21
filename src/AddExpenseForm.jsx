import React, { useState } from 'react';

const AddExpenseForm = ({ onAddExpense }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !amount || !date) {
      alert('Please fill in all fields.');
      return;
    }

    const expenseData = {
      title,
      amount: parseFloat(amount),
      date: new Date(date),
    };

    onAddExpense(expenseData);

    setTitle('');
    setAmount('');
    setDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 bg-white shadow-md rounded-md space-y-4">
      <h2 className="text-xl font-bold text-center">Add New Expense</h2>

      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded p-2" />

      <input type="number" placeholder="Amount (TK)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border rounded p-2" />

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded p-2" />

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Add Expense
      </button>
    </form>
  );
};

export default AddExpenseForm;
