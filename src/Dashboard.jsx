import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BudgetProgressBar from "./components/BudgetProgressBar";
import IncomeExpensePieChart from "./components/IncomeExpensePieChart";

const Dashboard = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [budget, setBudget] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        fetchFinancialData(user.uid);
      } else {
        navigate("/login");
      }
    });
  
    return () => unsubscribe();
  }, [navigate]);  

  const fetchFinancialData = async (uid) => {
    const incomeSnapshot = await getDocs(query(collection(db, "income"), where("uid", "==", uid)));
    const expenseSnapshot = await getDocs(query(collection(db, "expenses"), where("uid", "==", uid)));
    const budgetSnapshot = await getDocs(query(collection(db, "budgets"), where("uid", "==", uid)));

    let incomeTotal = 0;
    incomeSnapshot.forEach(doc => incomeTotal += Number(doc.data().amount || 0));
    setTotalIncome(incomeTotal);

    let expenseTotal = 0;
    expenseSnapshot.forEach(doc => expenseTotal += Number(doc.data().amount || 0));
    setTotalExpenses(expenseTotal);

    let latestBudget = 0;
    budgetSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === "monthly" || data.type === "yearly") {
        latestBudget = data.amount;
      }
    });
    setBudget(latestBudget);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const remaining = totalIncome - totalExpenses;

  return (
    <div className="dashboard-container" style={{ padding: "2rem" }}>
      <h1>Welcome to Your Dashboard</h1>

      <div style={{ margin: "20px 0", display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <button onClick={() => navigate("/income")}>View Income</button>
        <button onClick={() => navigate("/expenses")}>View Expenses</button>
        <button onClick={() => navigate("/budgets")}>Set Budget</button>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Financial Summary</h2>
        <p><strong>Total Income:</strong> TK {totalIncome}</p>
        <p><strong>Total Expenses:</strong> TK {totalExpenses}</p>
        <p><strong>Remaining Balance:</strong> TK {remaining}</p>
        <p><strong>Current Budget:</strong> TK {budget}</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <BudgetProgressBar totalExpenses={totalExpenses} budget={budget} />
        <IncomeExpensePieChart income={totalIncome} expenses={totalExpenses} />
      </div>
    </div>
  );
};

export default Dashboard;
