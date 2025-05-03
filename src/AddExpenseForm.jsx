import React, { useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const AddExpenseForm = () => {
  const { currentUser } = auth();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

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
    const month = date.slice(0, 7);

    try {
      await addDoc(collection(db, 'expenses'), {
        userId: currentUser.uid,
        category,
        amount: parsedAmount,
        date,
        description: description || '',
        paymentMethod: paymentMethod || '',
      });

      const expenseQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUser.uid)
      );
      const expenseSnapshot = await getDocs(expenseQuery);
      const expenses = expenseSnapshot.docs
        .map(doc => doc.data())
        .filter(exp => exp.date.startsWith(month));

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const budgetQuery = query(
        collection(db, 'budgets'),
        where('userId', '==', currentUser.uid)
      );
      const budgetSnapshot = await getDocs(budgetQuery);
      const budgets = budgetSnapshot.docs.map(doc => doc.data());

      const monthlyBudget = budgets.find(b => b.type === 'monthly' && b.month === month && b.year.toString() === year);
      const yearlyBudget = budgets.find(b => b.type === 'yearly' && b.year.toString() === year);

      const activeBudget = monthlyBudget || yearlyBudget;

      if (activeBudget && activeBudget.amount > 0) {
        const percentUsed = (totalExpenses / activeBudget.amount) * 100;
        if (percentUsed > 70 && percentUsed <= 100) {
          alert(
            `Warning: You've used ${percentUsed.toFixed(2)}% of your ${activeBudget.type} budget for ${activeBudget.type === 'monthly' ? month : year}.`
          );
        }
        else if (percentUsed > 100) {
          alert(
            `Warning: You've overused ${100 - percentUsed.toFixed(2)}% of your ${activeBudget.type} budget for ${activeBudget.type === 'monthly' ? month : year}.`
          );
        }
      }

      setCategory('');
      setAmount('');
      setDate('');
      setDescription('');
      setPaymentMethod('');
      alert('Expense added successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to add expense.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h2>Add Expense</h2>
      <input
        type="text"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="text"
        placeholder="Payment Method (optional)"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
      />
      <button type="submit">Add Expense</button>
    </form>
  );
};

export default AddExpenseForm;
