import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const SetBudgetPage = () => {
  const [budgetType, setBudgetType] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchBudgets(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchBudgets = async (uid) => {
    const q = query(collection(db, "budgets"), where("userId", "==", uid));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBudgets(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid, positive amount.");
      return;
    }

    if (!budgetType || (budgetType === "monthly" && (!month || !year)) || (budgetType === "yearly" && !year)) {
      alert("Please select valid budget type and date.");
      return;
    }

    const budgetData = {
      userId: currentUser.uid,
      type: budgetType,
      amount: parsedAmount,
      month: budgetType === "monthly" ? month : null,
      year: parseInt(year),
    };

    if (budgetType === "yearly") {
      const totalMonthly = budgets
        .filter(
          (b) => b.type === "monthly" && b.year === parseInt(year)
        )
        .reduce((sum, b) => sum + Number(b.amount), 0);

      if (totalMonthly > parsedAmount) {
        const confirm = window.confirm(
          `You've already set monthly budgets totaling TK ${totalMonthly} for ${year}, which exceeds your yearly budget. Do you still want to continue?`
        );
        if (!confirm) return;
      }
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "budgets", editingId), budgetData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "budgets"), budgetData);
      }

      fetchBudgets(currentUser.uid);
      setAmount("");
      setMonth("");
      setYear("");
      setBudgetType("");
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Failed to save budget.");
    }
  };

  const handleEdit = (budget) => {
    setEditingId(budget.id);
    setAmount(budget.amount);
    setBudgetType(budget.type);
    setMonth(budget.month || "");
    setYear(budget.year);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this budget?");
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, "budgets", id));
      fetchBudgets(currentUser.uid);
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{editingId ? "Edit Budget" : "Set Budget"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block mb-1 font-medium">Budget Type</label>
          <select
            value={budgetType}
            onChange={(e) => {
              setBudgetType(e.target.value);
              setMonth("");
              setYear("");
            }}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Type</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {budgetType === "monthly" && (
          <>
            <div>
              <label className="block mb-1 font-medium">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Select Month</option>
                {[
                  "January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"
                ].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </>
        )}

        {budgetType === "yearly" && (
          <div>
            <label className="block mb-1 font-medium">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
          </div>
        )}

        <div>
          <label className="block mb-1 font-medium">Amount (TK)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingId ? "Update Budget" : "Add Budget"}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">Your Budgets</h3>
        {budgets.length === 0 && <p>No budgets set yet.</p>}
        {budgets.map((b) => (
          <div key={b.id} className="border p-3 mb-3 rounded shadow-sm bg-gray-50">
            <p><strong>Type:</strong> {b.type}</p>
            <p><strong>Amount:</strong> TK {b.amount}</p>
            {b.type === "monthly" && <p><strong>Month:</strong> {b.month} {b.year}</p>}
            {b.type === "yearly" && <p><strong>Year:</strong> {b.year}</p>}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEdit(b)}
                className="px-3 py-1 text-white bg-green-600 rounded hover:bg-green-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(b.id)}
                className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetBudgetPage;
