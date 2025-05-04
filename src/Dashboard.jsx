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
  const [viewType, setViewType] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchFinancialData(user.uid, viewType, selectedDate);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate, viewType, selectedDate]);

  const adjustDate = (change) => {
    const newDate = new Date(selectedDate);
    if (viewType === "monthly") {
      newDate.setMonth(newDate.getMonth() + change);
    } else if (viewType === "yearly") {
      newDate.setFullYear(newDate.getFullYear() + change);
    }
    setSelectedDate(newDate);
  };

  const fetchFinancialData = async (uid, viewType, selectedDate) => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth(); 
    const monthName = selectedDate.toLocaleString("default", { month: "long" });

    const incomeSnapshot = await getDocs(query(collection(db, "income"), where("userId", "==", uid)));
    const expenseSnapshot = await getDocs(query(collection(db, "expenses"), where("userId", "==", uid)));
    const budgetSnapshot = await getDocs(query(collection(db, "budgets"), where("userId", "==", uid)));

    const startDate = new Date(year, viewType === "yearly" ? 0 : month, 1);
    const endDate = viewType === "yearly"
      ? new Date(year, 11, 31, 23, 59, 59)
      : new Date(year, month + 1, 0, 23, 59, 59);

    let incomeTotal = 0;
    incomeSnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date?.toDate?.(); 
  
      if (
        viewType === "total" ||
        (date && date >= startDate && date <= endDate)
      ) {
        incomeTotal += Number(data.amount || 0);
      }
    });

    let expenseTotal = 0;
    expenseSnapshot.forEach((doc) => {
      const data = doc.data();
      const dateStr = data.date;
      const date = dateStr ? new Date(dateStr) : null;
  
      if (
        viewType === "total" ||
        (date && date >= startDate && date <= endDate)
      ) {
        expenseTotal += Number(data.amount || 0);
      }
    });

    let budgetAmount = 0;
    budgetSnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        (viewType === "monthly" &&
          data.type === "monthly" &&
          data.month === monthName &&
          data.year === year) ||
        (viewType === "yearly" && data.type === "yearly" && data.year === year) ||
        viewType === "total"
      ) {
        budgetAmount = data.amount;
      }
    });
  
    setTotalIncome(incomeTotal);
    setTotalExpenses(expenseTotal);
    setBudget(budgetAmount);
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

      <div style={{ margin: "20px 0" }}>
        <label htmlFor="viewType">Summary View: </label>
        <select
          id="viewType"
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="total">Total</option>
        </select>

        {(viewType === "monthly" || viewType === "yearly") && (
          <div style={{ marginTop: "10px" }}>
            <button onClick={() => adjustDate(-1)}>{"<"}</button>
            <span style={{ margin: "0 10px" }}>
              {viewType === "monthly"
                ? selectedDate.toLocaleString("default", { month: "long", year: "numeric" })
                : selectedDate.getFullYear()}
            </span>
            <button onClick={() => adjustDate(1)}>{">"}</button>
          </div>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2>Financial Summary</h2>
        <p><strong>Total Income:</strong> TK {totalIncome}</p>
        <p><strong>Total Expenses:</strong> TK {totalExpenses}</p>
        <p><strong>Remaining Balance:</strong> TK {remaining}</p>
        <p><strong>Budget:</strong> TK {budget}</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <BudgetProgressBar totalExpenses={totalExpenses} budget={budget} />
        <IncomeExpensePieChart income={totalIncome} expenses={totalExpenses} />
      </div>
    </div>
  );
};

export default Dashboard;
