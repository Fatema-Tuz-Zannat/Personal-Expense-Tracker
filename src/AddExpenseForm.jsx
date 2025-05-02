import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AddExpenseForm = () => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !amount || !date) {
      alert('Category, Amount, and Date are required.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    const expenseDate = new Date(date);
    const year = expenseDate.getFullYear().toString();
    const month = date.slice(0, 7); // 'YYYY-MM'

    try {
      // Add new expense
      await addDoc(collection(db, 'expenses'), {
        userId: currentUser.uid,
        category,
        amount: parsedAmount,
        date,
        description: description || '',
        paymentMethod: paymentMethod || '',
      });

      alert('Expense added successfully.');

      // Fetch expenses for that month
      const expenseQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUser.uid)
      );
      const expenseSnapshot = await getDocs(expenseQuery);
      const expenses = expenseSnapshot.docs
        .map(doc => doc.data())
        .filter(exp => exp.date.startsWith(month));

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Fetch budget
      const budgetQuery = query(
        collection(db, 'budgets', currentUser.uid, 'budgetEntries'),
        where('period', 'in', [month, year])
      );
      const budgetSnapshot = await getDocs(budgetQuery);
      const budgets = budgetSnapshot.docs.map(doc => doc.data());

      const monthlyBudget = budgets.find(b => b.period === month);
      const yearlyBudget = budgets.find(b => b.period === year);

      const activeBudget = monthlyBudget || yearlyBudget;

      if (activeBudget && activeBudget.amount > 0) {
        const percentUsed = (totalExpenses / activeBudget.amount) * 100;
        if (percentUsed > 70) {
          alert(
            `Warning: You've used ${percentUsed.toFixed(
              2
            )}% of your ${activeBudget.type} budget.`
          );
        }
      }

      // Clear form
      setCategory('');
      setAmount('');
      setDate('');
      setDescription('');
      setPaymentMethod('');
    } catch (err) {
      console.error(err);
      alert('Failed to add expense.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Expense</h2>

      <label>Category *</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)} required>
        <option value="">-- Select Category --</option>
        <option value="Food">Food</option>
        <option value="Rent">Rent</option>
        <option value="Transportation">Transportation</option>
        <option value="Clothing">Clothing</option>
        <option value="Medical">Medical</option>
        <option value="Other">Other</option>
      </select>

      <label>Amount (TK) *</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <label>Date *</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <label>Description (Optional)</label>
      <input
        type="text"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label>Payment Method (Optional)</label>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
      >
        <option value="">-- Select Method --</option>
        <option value="Cash">Cash</option>
        <option value="Credit Card">Credit Card</option>
        <option value="Debit Card">Debit Card</option>
        <option value="Bkash">Bkash</option>
        <option value="Nagad">Nagad</option>
        <option value="Other">Other</option>
      </select>

      <button type="submit">Add Expense</button>
    </form>
  );
};

export default AddExpenseForm;
