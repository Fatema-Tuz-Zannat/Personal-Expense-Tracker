import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const SetBudgetPage = () => {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("monthly");
  const [budgets, setBudgets] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        fetchBudgets(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchBudgets = async (uid) => {
    const q = query(collection(db, "budgets"));
    const querySnapshot = await getDocs(q);
    const budgetList = [];
    querySnapshot.forEach((doc) => {
      if (doc.data().userId === uid) {
        budgetList.push({ id: doc.id, ...doc.data() });
      }
    });
    setBudgets(budgetList);
  };

  const handleAddBudget = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const parsedAmount = Number(amount);

    if (parsedAmount <= 0) {
      alert("Budget must be a positive number.");
      return;
    }

    if (type === "yearly") {
      const monthlyBudgets = budgets.filter(
        (b) => b.type === "monthly" && b.year === year
      );
      const totalMonthly = monthlyBudgets.reduce((sum, b) => sum + b.amount, 0);

      if (parsedAmount < totalMonthly) {
        const proceed = window.confirm(
          `Your yearly budget is less than total monthly budgets for this year (TK ${totalMonthly}). Do you still want to continue?`
        );
        if (!proceed) return;
      }
    }

    await addDoc(collection(db, "budgets"), {
      userId,
      amount: parsedAmount,
      type,
      month: month,
      year: year,
    });

    setAmount("");
    fetchBudgets(userId);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "budgets", id));
    fetchBudgets(userId);
  };

  const handleEdit = async (id) => {
    const newAmount = prompt("Enter new budget amount:");
    if (!newAmount || isNaN(newAmount) || Number(newAmount) <= 0) {
      alert("Invalid amount.");
      return;
    }
    await updateDoc(doc(db, "budgets", id), {
      amount: Number(newAmount),
    });
    fetchBudgets(userId);
  };

  return (
    <div className="budget-page">
      <h2>Set Budget</h2>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
      <input
        type="number"
        placeholder="Enter budget amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleAddBudget}>Set Budget</button>

      <h3>Existing Budgets</h3>
      <ul>
        {budgets.map((budget) => (
          <li key={budget.id}>
            {budget.type} - TK {budget.amount} ({budget.month}/{budget.year})
            <button onClick={() => handleEdit(budget.id)}>Edit</button>
            <button onClick={() => handleDelete(budget.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SetBudgetPage;
