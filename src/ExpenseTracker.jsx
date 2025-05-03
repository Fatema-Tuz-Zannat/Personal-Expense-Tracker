import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AddExpenseForm from './AddExpenseForm';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchExpenses = async () => {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExpenses(expensesData);
    };

    fetchExpenses();
  }, [currentUser]);

  const handleAddExpense = async (expense) => {
    const expenseWithUser = {
      ...expense,
      userId: currentUser.uid,
    };
    const docRef = await addDoc(collection(db, 'expenses'), expenseWithUser);
    setExpenses(prev => [{ ...expenseWithUser, id: docRef.id }, ...prev]);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleUpdate = async (id, updatedExpense) => {
    await updateDoc(doc(db, 'expenses', id), updatedExpense);
    setExpenses(prev =>
      prev.map(exp =>
        exp.id === id ? { ...exp, ...updatedExpense } : exp
      )
    );
    setEditingId(null);
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
              <li
                key={expense.id}
                className="flex justify-between items-start border-b pb-3"
              >
                {editingId === expense.id ? (
                  <EditExpenseForm
                    expense={expense}
                    onSave={(updatedExpense) =>
                      handleUpdate(expense.id, updatedExpense)
                    }
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.category} | {expense.paymentMethod || ''}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(expense.date).toDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">TK{expense.amount.toFixed(2)}</p>
                      <div className="flex gap-2 text-sm mt-1">
                        <button
                          onClick={() => handleEdit(expense.id)}
                          className="text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const EditExpenseForm = ({ expense, onSave, onCancel }) => {
  const [amount, setAmount] = useState(expense.amount);
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(expense.date);
  const [description, setDescription] = useState(expense.description);
  const [paymentMethod, setPaymentMethod] = useState(expense.paymentMethod || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      amount: parseFloat(amount),
      category,
      date,
      description,
      paymentMethod,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-2">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded p-1"
        placeholder="Description"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border rounded p-1"
        placeholder="Amount"
      />
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border rounded p-1"
        placeholder="Category"
      />
      <input
        type="text"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="w-full border rounded p-1"
        placeholder="Payment Method"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border rounded p-1"
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:underline"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="text-sm text-green-600 font-semibold hover:underline"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default ExpenseTracker;
