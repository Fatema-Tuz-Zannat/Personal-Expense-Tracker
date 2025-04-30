import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const IncomeTracker = () => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [incomes, setIncomes] = useState([]);
  const user = auth.currentUser;

  const fetchIncomes = async () => {
    if (!user) return;
    const q = query(
      collection(db, 'incomes'),
      where('userId', '==', user.uid)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setIncomes(data);
  };

  useEffect(() => {
    fetchIncomes();
  }, [user]);

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!source || !amount || !date) return;

    await addDoc(collection(db, 'incomes'), {
      userId: user.uid,
      source,
      amount: parseFloat(amount),
      description,
      date,
    });

    setSource('');
    setAmount('');
    setDescription('');
    setDate('');
    fetchIncomes();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'incomes', id));
    fetchIncomes();
  };

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Income Tracker</h2>

      <form
        onSubmit={handleAddIncome}
        className="space-y-3 bg-white p-4 rounded shadow"
      >
        <input
          type="text"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Add Income
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">Total Income: ₹{totalIncome.toFixed(2)}</h3>
        <ul className="mt-4 space-y-2">
          {incomes.map((income) => (
            <li
              key={income.id}
              className="flex justify-between items-center bg-gray-100 p-2 rounded"
            >
              <div>
                <p className="font-medium">{income.source}</p>
                <p className="text-sm text-gray-600">₹{income.amount} — {income.date}</p>
                {income.description && (
                  <p className="text-xs text-gray-500 italic">{income.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(income.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IncomeTracker;
