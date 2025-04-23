import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

const ExpenseTracker = ({ user }) => {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    const q = query(collection(db, 'expenses'), where('uid', '==', user.uid));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
    }));
    setExpenses(data);
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    if (!title || !amount || !date) return alert('Please fill in all fields');

    const expenseData = {
      title,
      amount: parseFloat(amount),
      date: new Date(date),
      uid: user.uid,
    };

    try {
      if (editingId) {
        const expenseRef = doc(db, 'expenses', editingId);
        await updateDoc(expenseRef, expenseData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'expenses'), expenseData);
      }

      setTitle('');
      setAmount('');
      setDate('');
      fetchExpenses();
    } catch (error) {
      console.error('Error adding/updating expense:', error);
    }
  };

  const handleEdit = (expense) => {
    setTitle(expense.title);
    setAmount(expense.amount);
    setDate(expense.date.toISOString().split('T')[0]);
    setEditingId(expense.id);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
    fetchExpenses();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Personal Expense Tracker</h1>

      <form onSubmit={handleAddOrUpdate} className="max-w-md mx-auto p-4 bg-white shadow-md rounded-md space-y-4">
        <h2 className="text-xl font-bold text-center">
          {editingId ? 'Edit Expense' : 'Add New Expense'}
        </h2>

        <input
          type="text"
          placeholder="Title"
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

        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          {editingId ? 'Update Expense' : 'Add Expense'}
        </button>
      </form>

      <div className="mt-8 max-w-md mx-auto bg-white shadow-md rounded-md p-4">
        <h2 className="text-xl font-semibold mb-4">Your Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center">No expenses added yet.</p>
        ) : (
          <ul className="space-y-3">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{expense.title}</p>
                  <p className="text-sm text-gray-500">{expense.date.toDateString()}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <p className="font-semibold">₹{expense.amount.toFixed(2)}</p>
                  <button onClick={() => handleEdit(expense)} className="text-blue-500 text-sm">Edit</button>
                  <button onClick={() => handleDelete(expense.id)} className="text-red-500 text-sm">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;
