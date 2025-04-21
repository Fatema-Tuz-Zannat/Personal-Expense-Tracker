import React, { useState, useEffect } from 'react';
import AddExpenseForm from './AddExpenseForm';
import db from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);

  // Fetch expenses from Firestore
  useEffect(() => {
    const q = query(collection(db, "expenses"), orderBy("date", "desc"));

    // Real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedExpenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }));
      setExpenses(fetchedExpenses);
    });

    return () => unsubscribe();
  }, []);

  // Add a new expense to Firestore
  const handleAddExpense = async (expense) => {
    try {
      await addDoc(collection(db, "expenses"), expense);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
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
              <li key={expense.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{expense.title}</p>
                  <p className="text-sm text-gray-500">{expense.date.toDateString()}</p>
                </div>
                <p className="font-semibold">₹{expense.amount.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracker;
