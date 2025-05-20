import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AddExpenseForm = () => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

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
    const monthName = expenseDate.toLocaleString('default', { month: 'long' });

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
        .filter(exp => {
          const expDate = new Date(exp.date);
          return (
            expDate.getMonth() === expenseDate.getMonth() &&
            expDate.getFullYear() === expenseDate.getFullYear()
          );
        });

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const budgetQuery = query(
        collection(db, 'budgets'),
        where('userId', '==', currentUser.uid)
      );
      const budgetSnapshot = await getDocs(budgetQuery);
      const budgets = budgetSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const monthlyBudget = budgets.find(b => b.type === 'monthly' && b.month === monthName && b.year.toString() === year);
      const yearlyBudget = budgets.find(b => b.type === 'yearly' && b.year?.toString() === year);

      const activeBudget = monthlyBudget || yearlyBudget;

      if (activeBudget && activeBudget.amount > 0) {
        const percentUsed = (totalExpenses / activeBudget.amount) * 100;
        if (percentUsed > 70 && percentUsed <= 100) {
          alert(
            `Warning: You've used ${percentUsed.toFixed(2)}% of your ${activeBudget.type} budget for ${
              activeBudget.type === 'monthly' ? monthName : year
            }.`
          );
        } else if (percentUsed > 100) {
          alert(
            `Warning: You've exceeded your ${activeBudget.type} budget for ${
              activeBudget.type === 'monthly' ? monthName : year
            } by ${(percentUsed - 100).toFixed(2)}%.`
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

  const handleCancel = () => {
    navigate('/expense'); 
  };

  const formStyle = {
    maxWidth: '500px',
    margin: '40px auto',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 0 15px rgba(0,0,0,0.15)',
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    marginTop: '15px',
    fontWeight: 'bold',
    color: '#333',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  };

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: '14px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
  };

  const addButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#28a745',
    color: '#fff',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: '#fff',
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Add Expense</h2>

      <label style={labelStyle}>Category *</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} required>
        <option value="">-- Select Category --</option>
        <option value="Food">Food</option>
        <option value="Rent">Rent</option>
        <option value="Transportation">Transportation</option>
        <option value="Utilities">Utilities</option>
        <option value="Entertainment">Entertainment</option>
        <option value="Shopping">Shopping</option>
        <option value="Healthcare">Healthcare</option>
        <option value="Education">Education</option>
        <option value="Other">Other</option>
      </select>

      <label style={labelStyle}>Amount (TK) *</label>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} required />

      <label style={labelStyle}>Date *</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} required />

      <label style={labelStyle}>Description (Optional)</label>
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />

      <label style={labelStyle}>Payment Method (Optional)</label>
      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputStyle}>
        <option value="">-- Select Method --</option>
        <option value="Cash">Cash</option>
        <option value="Credit Card">Credit Card</option>
        <option value="Debit Card">Debit Card</option>
        <option value="Bkash">Bkash</option>
        <option value="Nagad">Nagad</option>
        <option value="Other">Other</option>
      </select>

      <div style={buttonContainerStyle}>
        <button type="submit" style={addButtonStyle}>Add Expense</button>
        <button type="button" style={cancelButtonStyle} onClick={handleCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default AddExpenseForm;
