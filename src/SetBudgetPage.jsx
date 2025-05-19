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

const currentYear = new Date().getFullYear();

const SetBudgetPage = () => {
  const [budgetType, setBudgetType] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [displayYear, setDisplayYear] = useState(currentYear);
  const [filterType, setFilterType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

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
    if (parseInt(year) <= 1990) {
      alert("Year must be greater than 1990.");
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

  const filteredBudgets = budgets
    .filter((b) => b.year === displayYear)
    .filter((b) => (filterType ? b.type === filterType : true))
    .filter((b) => (filterMonth ? b.month === filterMonth : true))
    .sort((a, b) => {
      if (a.type === "yearly" && b.type === "monthly") return -1;
      if (a.type === "monthly" && b.type === "yearly") return 1;
      if (a.type === "monthly" && b.type === "monthly") {
        return (
          new Date(`${b.month} 1, ${b.year}`) -
          new Date(`${a.month} 1, ${a.year}`)
        );
      }
      return b.year - a.year;
    });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
    <div>
    <DashboardHeaderNav
      title="Budget Manager"
    />
    </div>
    <div style={{ paddingTop: "150px"}}>
      <form onSubmit={handleSubmit} style={{ marginBottom: "30px", border: "1px solid #ccc", padding: "20px", borderRadius: "5px" }}>
        <h3>{editingId ? "Edit Budget" : "Set Budget"}</h3>
        <div style={{ marginBottom: "10px" }}>
          <label>Budget Type:</label>
          <select
            value={budgetType}
            onChange={(e) => {
              setBudgetType(e.target.value);
              setMonth("");
              setYear("");
            }}
            style={{ marginLeft: "10px" }}
          >
            <option value="">Select Type</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        {budgetType === "monthly" && (
          <>
            <div style={{ marginBottom: "10px" }}>
              <label>Month:</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{ marginLeft: "0px" }}
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Year:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{ marginLeft: "0px" }}
              />
            </div>
          </>
        )}
        {budgetType === "yearly" && (
          <div style={{ marginBottom: "10px" }}>
            <label>Year:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ marginLeft: "10px" }}
            />
          </div>
        )}
        <div style={{ marginBottom: "10px" }}>
          <label>Amount (TK):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ marginLeft: "10px" }}
          />
        </div>
        <button type="submit" style={{ backgroundColor: "#006400", color: "#fff", padding: "6px 12px", border: "none", borderRadius: "4px" }}>
          {editingId ? "Update Budget" : "Add Budget"}
        </button>
      </form>

      <div style={{ marginBottom: "10px", display: "flex", gap: "20px", alignItems: "center" }}>
        <div>
          <button onClick={() => setDisplayYear(displayYear - 1)} style={{
        backgroundColor: "#065f46",
        color: "white",
        padding: "4px 10px",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer"
      }} >&lt;</button>
          <strong style={{ margin: "0 10px" }}>{displayYear}</strong>
          <button onClick={() => setDisplayYear(displayYear + 1)} style={{
        backgroundColor: "#065f46",
        color: "white",
        padding: "4px 10px",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer"
      }}>&gt;</button>
        </div>
        <div>
          <label>Filter Type:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ marginLeft: "10px" }}>
            <option value="">All</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label>Filter Month:</label>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ marginLeft: "10px" }}>
            <option value="">All</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#006400" }}>
            <th style={{ border: "6px solid white", padding: "8px" }}>Type</th>
            <th style={{ border: "6px solid white", padding: "8px" }}>Amount (TK)</th>
            <th style={{ border: "6px solid white", padding: "8px" }}>Month</th>
            <th style={{ border: "6px solid white", padding: "8px" }}>Year</th>
            <th style={{ border: "6px solid white", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredBudgets.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "10px" }}>No budgets found.</td>
            </tr>
          ) : (
            filteredBudgets.map((b) => (
              <tr key={b.id}>
                <td style={{ border: "6px solid white", padding: "8px" }}>{b.type}</td>
                <td style={{ border: "6px solid white", padding: "8px" }}>TK {b.amount}</td>
                <td style={{ border: "6px solid white", padding: "8px" }}>{b.month || "-"}</td>
                <td style={{ border: "6px solid white", padding: "8px" }}>{b.year}</td>
                <td style={{ border: "6px solid white", padding: "8px" }}>
                  <button onClick={() => handleEdit(b)} style={{ marginRight: "5px" }}>Edit</button>
                  <button onClick={() => handleDelete(b.id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
};

export default SetBudgetPage;
