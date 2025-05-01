import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

const IncomeTracker = () => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [incomes, setIncomes] = useState([]);

  const user = auth.currentUser;

  const fetchIncomes = useCallback(async () => {
    if (!user) return;

    const q = query(collection(db, 'incomes'), where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const incomeData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setIncomes(incomeData);
  }, [user]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!source || !amount || !date) {
      alert('Please fill all required fields.');
      return;
    }

    await addDoc(collection(db, 'incomes'), {
      userId: user.uid,
      source,
      amount: parseFloat(amount),
      description,
      date: Timestamp.fromDate(new Date(date)),
    });

    setSource('');
    setAmount('');
    setDescription('');
    setDate('');
    fetchIncomes();
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Income Tracker</h1>

      <form onSubmit={handleAddIncome} className="space-y-4 mb-6 w-full max-w-md">
        <input
          type="text"
          placeholder="Source *"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Amount (TK) *"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Add Income
        </button>
      </form>

      <div className="w-full max-w-md space-y-2">
        {incomes.map((income) => (
          <div key={income.id} className="bg-white p-4 rounded shadow">
            <p><strong>Source:</strong> {income.source}</p>
            <p><strong>Amount:</strong> TK {income.amount.toFixed(2)}</p>
            {income.description && <p><strong>Description:</strong> {income.description}</p>}
            <p><strong>Date:</strong> {income.date.toDate().toDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomeTracker;
