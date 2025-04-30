import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from './firebase';
import { addDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const IncomeTracker = () => {
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [incomes, setIncomes] = useState([]);

  const user = auth.currentUser;

  const fetchIncomes = useCallback(async () => {
    if (!user) return;

    const q = query(collection(db, 'income'), where('userId', '==', user.uid));
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
      alert('Source, Amount and Date are required.');
      return;
    }

    try {
      await addDoc(collection(db, 'income'), {
        source,
        amount: parseFloat(amount),
        description,
        date: Timestamp.fromDate(new Date(date)),
        userId: user.uid,
      });

      setSource('');
      setAmount('');
      setDescription('');
      setDate('');
      fetchIncomes();
    } catch (error) {
      alert('Failed to add income: ' + error.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Add Income</h2>
      <form onSubmit={handleAddIncome} className="space-y-2">
        <input
          type="text"
          placeholder="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          required
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="border px-3 py-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Income
        </button>
      </form>

      <h3 className="text-xl font-semibold mt-6">Income List</h3>
      <ul className="mt-2">
        {incomes.map((income) => (
          <li key={income.id} className="border-b py-2">
            {income.source} — TK{income.amount} on{' '}
            {income.date?.toDate().toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IncomeTracker;
