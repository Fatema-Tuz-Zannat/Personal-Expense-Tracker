import React, { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const q = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        );

        onSnapshot(q, (snapshot) => {
          const expenseData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setExpenses(expenseData);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddExpense = async () => {
    if (!amount || !date || !category) {
      alert("Please fill in all required fields.");
      return;
    }

    const expense = {
      category,
      amount: parseFloat(amount),
      date,
      description,
      paymentMethod,
      userId,
    };

    await addDoc(collection(db, "expenses"), expense);

    setCategory("Food");
    setAmount("");
    setDate("");
    setDescription("");
    setPaymentMethod("");
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "expenses", id));
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Add Expense</h2>
      <div className="space-y-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="Food">Food</option>
          <option value="Rent">Rent</option>
          <option value="Transportation">Transportation</option>
          <option value="Clothing">Clothing</option>
          <option value="Medical">Medical</option>
          <option value="Other">Other</option>
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Payment Method (optional)</option>
          <option value="Cash">Cash</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="Bkash">Bkash</option>
          <option value="Nagad">Nagad</option>
          <option value="Other">Other</option>
        </select>
        <button
          onClick={handleAddExpense}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Expense
        </button>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Your Expenses</h2>
      {expenses.map((exp) => (
        <div
          key={exp.id}
          className="border p-4 mb-2 rounded shadow-sm bg-white"
        >
          <div><strong>Category:</strong> {exp.category}</div>
          <div><strong>Amount:</strong> TK {exp.amount}</div>
          <div><strong>Date:</strong> {exp.date}</div>
          {exp.description && <div><strong>Description:</strong> {exp.description}</div>}
          {exp.paymentMethod && <div><strong>Payment:</strong> {exp.paymentMethod}</div>}
          <button
            onClick={() => handleDelete(exp.id)}
            className="mt-2 text-red-500"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

export default ExpenseTracker;
