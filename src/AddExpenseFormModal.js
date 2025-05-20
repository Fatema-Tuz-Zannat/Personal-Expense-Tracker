import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AddExpenseFormModal = ({ onClose }) => {
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

      alert('Expense added successfully.');
      onClose(); 
    } catch (err) {
      console.error(err);
      alert('Failed to add expense.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <h2>Add Expense</h2>
        <label>Category *</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
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

        <label>Amount (TK) *</label>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />

        <label>Date *</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />

        <label>Description (Optional)</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />

        <label>Payment Method (Optional)</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="">-- Select Method --</option>
          <option value="Cash">Cash</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="Bkash">Bkash</option>
          <option value="Nagad">Nagad</option>
          <option value="Other">Other</option>
        </select>

        <div style={{ marginTop: "15px", textAlign: "right" }}>
          <button type="button" onClick={onClose} style={{ marginRight: "10px" }}>
            Cancel
          </button>
          <button type="submit">Add</button>
        </div>
      </form>
    </div>
  );
};

export default AddExpenseFormModal;
