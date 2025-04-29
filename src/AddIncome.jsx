import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useNavigate } from 'react-router-dom';

const AddIncome = () => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!source || !amount || !date) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'income'), {
        source,
        amount: parseFloat(amount),
        description,
        date,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });

      navigate('/'); 
    } catch (err) {
      setError('Failed to add income. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold">Add Income</h2>

        {error && <p className="text-red-500">{error}</p>}

        <input
          type="text"
          placeholder="Source *"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Amount *"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />

        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <button type="submit" className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700">
          Add Income
        </button>
      </form>
    </div>
  );
};

export default AddIncome;
