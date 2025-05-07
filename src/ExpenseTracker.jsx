import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { useNavigate } from "react-router-dom";

function ExpenseTracker() {
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedAmount, setEditedAmount] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [filterType, setFilterType] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categoryFilter, setCategoryFilter] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "expenses"),
      where("userId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const expenseData = [];
      querySnapshot.forEach((doc) => {
        expenseData.push({ ...doc.data(), id: doc.id });
      });
      setExpenses(expenseData);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "expenses", id));
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense.id);
    setEditedTitle(expense.title);
    setEditedAmount(expense.amount);
  
    const parsedDate = new Date(expense.date);
    const isoDate = parsedDate.toISOString().split("T")[0];
    setEditedDate(isoDate);
  
    setEditedCategory(expense.category || "Other");
  };
  
  const handleSave = async (id) => {
    if (!editedTitle.trim() || !editedAmount || !editedDate) {
      alert("Please fill in all fields.");
      return;
    }
  
    const updatedExpense = {
      title: editedTitle.trim(),
      amount: parseFloat(editedAmount),
      date: editedDate, 
      category: editedCategory || "Other",
    };
  
    try {
      await updateDoc(doc(db, "expenses", id), updatedExpense);
      setEditingExpense(null);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense. Please try again.");
    }
  };
  

  const handleCancel = () => {
    setEditingExpense(null);
  };

  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    filterType === "monthly"
      ? newDate.setMonth(newDate.getMonth() - 1)
      : newDate.setFullYear(newDate.getFullYear() - 1);
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    filterType === "monthly"
      ? newDate.setMonth(newDate.getMonth() + 1)
      : newDate.setFullYear(newDate.getFullYear() + 1);
    setSelectedDate(newDate);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    const matchesDate =
      filterType === "monthly"
        ? expenseDate.getMonth() === selectedDate.getMonth() &&
          expenseDate.getFullYear() === selectedDate.getFullYear()
        : filterType === "yearly"
        ? expenseDate.getFullYear() === selectedDate.getFullYear()
        : true;

    const matchesCategory =
      categoryFilter === "all" ? true : expense.category === categoryFilter;

    return matchesDate && matchesCategory;
  });

  return (
    <div>
      <h2>Expenses</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>View: </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="all">All</option>
        </select>

        {filterType !== "all" && (
          <>
            <button onClick={handlePrev}>◀</button>
            <span style={{ margin: "0 10px" }}>
              {filterType === "monthly"
                ? selectedDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })
                : selectedDate.getFullYear()}
            </span>
            <button onClick={handleNext}>▶</button>
          </>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Filter by Category: </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All</option>
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
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => navigate("/add-expense")}>+ Add Expense</button>
      </div>

      <ul>
        {filteredExpenses.map((expense) => (
          <li key={expense.id}>
            {editingExpense === expense.id ? (
              <div>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
                <input
                  type="number"
                  value={editedAmount}
                  onChange={(e) => setEditedAmount(e.target.value)}
                />
                <input
                  type="date"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                />
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                >
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
                <button onClick={() => handleSave(expenses.id)}>Save</button>
                <button onClick={handleCancel}>Cancel</button>
              </div>
            ) : (
              <div>
                <strong>{expense.title}</strong> — TK {expense.amount} on{" "}
                {new Date(expense.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                ({expense.category || "Other"})
                <button onClick={() => handleEdit(expense)}>Edit</button>
                <button onClick={() => handleDelete(expense.id)}>
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExpenseTracker;
