import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from './firebase';
import {
  collection, getDocs, deleteDoc, doc, updateDoc, query, where
} from 'firebase/firestore';
import { getCurrentMonthYear } from './dateHelpers';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', amount: '', date: '' });
  const [budget, setBudget] = useState(null);

  const currentUser = auth.currentUser;
  const { currentMonth, currentYear } = getCurrentMonthYear();

  const fetchExpenses = useCallback(async () => {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExpenses(data);
  }, [currentUser.uid]);

  const fetchBudget = useCallback(async () => {
    const budgetRef = collection(db, 'budgets');
    const q = query(budgetRef, where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    let monthlyBudget = null;
    let yearlyBudget = null;

    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'monthly' && data.month === currentMonth && data.year === currentYear) {
        monthlyBudget = data.amount;
      } else if (data.type === 'yearly' && data.year === currentYear) {
        yearlyBudget = data.amount;
      }
    });

    setBudget(monthlyBudget || yearlyBudget || null);
  }, [currentUser.uid, currentMonth, currentYear]);

  useEffect(() => {
    fetchExpenses();
    fetchBudget();
  }, [fetchExpenses, fetchBudget]);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
    fetchExpenses();
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setEditForm({ title: expense.title, amount: expense.amount, date: expense.date });
  };

  const handleUpdate = async () => {
    const { title, amount, date } = editForm;

    if (!title || !amount || !date) {
      alert('Please fill in all fields.');
      return;
    }

    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);

    let totalMonthlyExpenses = 0;

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const docDate = new Date(data.date);
      if (
        docSnap.id !== editingId &&
        docDate.getMonth() + 1 === month &&
        docDate.getFullYear() === year
      ) {
        totalMonthlyExpenses += parseFloat(data.amount);
      }
    });

    const newTotal = totalMonthlyExpenses + parseFloat(amount);
    const budgetLimit = budget || 0;
    const usagePercentage = ((newTotal / budgetLimit) * 100).toFixed(2);

    if (budgetLimit > 0 && newTotal > 0.7 * budgetLimit) {
      const confirmEdit = window.confirm(
        `Warning: Updating this expense will exceed 70% of your monthly budget (${usagePercentage}%). Continue?`
      );
      if (!confirmEdit) return;
    }

    await updateDoc(doc(db, 'expenses', editingId), {
      title,
      amount: parseFloat(amount),
      date
    });

    setEditingId(null);
    setEditForm({ title: '', amount: '', date: '' });
    fetchExpenses();
  };

  return (
    <div>
      <h3>Expense List</h3>
      <ul>
        {expenses.map(expense => (
          <li key={expense.id}>
            {editingId === expense.id ? (
              <>
                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                <input value={editForm.amount} type="number" onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
                <input value={editForm.date} type="date" onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                <button onClick={handleUpdate}>Update</button>
              </>
            ) : (
              <>
                {expense.title} - TK {expense.amount} - {expense.date}
                <button onClick={() => handleEdit(expense)}>Edit</button>
                <button onClick={() => handleDelete(expense.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExpenseTracker;
