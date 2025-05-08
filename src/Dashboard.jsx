import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BudgetProgressBar from "./components/BudgetProgressBar";
import IncomeExpensePieChart from "./components/IncomeExpensePieChart";
import CategorizedExpenseBarChart from "./components/CategorizedExpenseBarChart";
import "./Dashboard.css";

const Dashboard = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [budget, setBudget] = useState(0);
  const [viewType, setViewType] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayIncome, setTodayIncome] = useState([]);
  const [todayExpenses, setTodayExpenses] = useState([]);
  const [showTodayReport, setShowTodayReport] = useState(false);
  const [expenseData, setExpenseData] = useState([]);

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

    const today = new Date().toDateString();

    let incomeTotal = 0;
    let todayIncomeList = [];

    incomeSnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date?.toDate?.();
      if (viewType === "total" || (date && date >= startDate && date <= endDate)) {
        incomeTotal += Number(data.amount || 0);
      }
      if (date && date.toDateString() === today) {
        todayIncomeList.push({ title: data.title, amount: data.amount });
      }
    });

    let expenseTotal = 0;
    let todayExpenseList = [];
    let filteredExpenses = [];

    expenseSnapshot.forEach((doc) => {
      const data = doc.data();
      const dateStr = data.date;
      const date = dateStr ? new Date(dateStr) : null;

      if (viewType === "total" || (date && date >= startDate && date <= endDate)) {
        expenseTotal += Number(data.amount || 0);
        filteredExpenses.push(data);
      }
      if (date && date.toDateString() === today) {
        todayExpenseList.push({ title: data.title, amount: data.amount });
      }
    });

    let budgetAmount = 0;
    budgetSnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        (viewType === "monthly" && data.type === "monthly" && data.month === monthName && data.year === year) ||
        (viewType === "yearly" && data.type === "yearly" && data.year === year)
      ) {
        budgetAmount = data.amount;
      }
    });

    setTotalIncome(incomeTotal);
    setTotalExpenses(expenseTotal);
    setBudget(budgetAmount);
    setTodayIncome(todayIncomeList);
    setTodayExpenses(todayExpenseList);
    setExpenseData(filteredExpenses);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const remaining = totalIncome - totalExpenses;
  const budgetRemaining = budget - totalExpenses;

  return (
    <div className="dashboard-container">
      <h1>Welcome to Your Dashboard</h1>

      <div className="top-buttons">
        <button onClick={() => navigate("/income")}>View Income</button>
        <button onClick={() => navigate("/expenses")}>View Expenses</button>
        <button onClick={() => navigate("/budgets")}>Set Budget</button>
        <button onClick={handleLogout}>Logout</button>
        <button onClick={() => setShowTodayReport(true)}>Today's Report</button>
      </div>

      <div className="summary-controls">
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
          <div className="date-navigation">
            <button onClick={() => adjustDate(-1)}>{"<"}</button>
            <span>
              {viewType === "monthly"
                ? selectedDate.toLocaleString("default", { month: "long", year: "numeric" })
                : selectedDate.getFullYear()}
            </span>
            <button onClick={() => adjustDate(1)}>{">"}</button>
          </div>
        )}
      </div>

      <div className="summary">
        <h2>Financial Summary</h2>
        <p><strong>Total Income:</strong> TK {totalIncome}</p>
        <p><strong>Total Expenses:</strong> TK {totalExpenses}</p>
        <p><strong>Remaining Balance:</strong> TK {remaining}</p>
        <p><strong>Budget:</strong> TK {budget}</p>
      </div>

      <div className="charts-section">
        <BudgetProgressBar totalExpenses={totalExpenses} budget={budget} />
        <IncomeExpensePieChart income={totalIncome} expenses={totalExpenses} />
        <CategorizedExpenseBarChart expenseData={expenseData} />
      </div>

      {showTodayReport && (
        <div className="modal-overlay">
        <div className="modal-content">
        <h3>Today's Report</h3>
        <h4>Income</h4>
        <ul>
          {todayIncome.map((item) => (
            <li key={item.id}>{item.title}: TK {item.amount}</li>
          ))}
        </ul>
        <h4>Expenses</h4>
        <ul>
          {todayExpenses.map((item) => (
            <li key={item.id}>{item.title}: TK {item.amount}</li>
          ))}
        </ul>
        <p>Monthly Budget: TK {budget}</p>
        <p>Remaining: TK {budget - totalExpenses}</p>
        <button onClick={() => setShowTodayReport(false)}>Close</button>
        </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
