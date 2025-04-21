import React, { useState, useEffect } from 'react';
import AddExpenseForm from './AddExpenseForm';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from './firebase';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', amount: '', date: '' });

  useEffect(() => {
    const fetchExpenses = async () => {
      const snapshot = await getDocs(collection(db, 'expenses'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    };

    fetchExpenses();
  }, []);

  const handleAddExpense = async (expense) => {
    const docRef = await addDoc(collection(db, 'expenses'), expense);
    setExpenses(prev => [{ id: docRef.id, ...expense }, ...prev]);
  };

  const handleDeleteExpense = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const handleEditClick = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      title: expense.title,
      amount: expense.amount,
      date: new Date(expense.date.seconds * 1000).toISOString().split('T')[0],
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (id) => {
    const updatedExpense = {
      ...editForm,
      amount: parseFloat(editForm.amount),
      date: new Date(editForm.date),
    };

    await updateDoc(doc(db, 'expenses', id), updatedExpense);
    setExpenses(prev =>
      prev.map(exp => (exp.id === id ? { id, ...updatedExpense } : exp))
    );
    setEditingId(null);
    setEditForm({ title: '', amount: '', date: '' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Personal Expense Tracker</h1>

      <AddExpenseForm onAddExpense={handleAddExpense} />

      <div className="mt-8 max-w-md mx-auto bg-white shadow-md rounded-md p-4">
        <h2 className="text-xl font-semibold mb-4">Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center">No expenses added yet.</p>
        ) : (
          <ul className="space-y-3">
            {expenses.map((expense) => (
              <li key={expense.id} className="border-b pb-2">
                {editingId === expense.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleEditChange}
                      className="w-full border rounded p-1"
                    />
                    <input
                      type="number"
                      name="amount"
                      value={editForm.amount}
                      onChange={handleEditChange}
                      className="w-full border rounded p-1"
                    />
                    <input
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                      className="w-full border rounded p-1"
                    />
                    <button
                      onClick={() => handleEditSubmit(expense.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-400 text-white px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(expense.date.seconds * 1000).toDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{expense.amount.toFixed(2)}</p>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleEditClick(expense)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;
