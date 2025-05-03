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
    const monthName = selectedDate.toLocaleString("default", { month: "long" });
    const year = selectedDate.getFullYear();

    let incomeQuery = collection(db, "income");
    let expenseQuery = collection(db, "expenses");
    let budgetQuery = collection(db, "budgets");

    if (viewType === "monthly") {
      incomeQuery = query(
        incomeQuery,
        where("userId", "==", uid),
        where("date", ">=", new Date(year, selectedDate.getMonth(), 1)),
        where("date", "<=", new Date(year, selectedDate.getMonth() + 1, 0))
      );

      expenseQuery = query(
        expenseQuery,
        where("userId", "==", uid),
        where("date", ">=", `${year}-${(selectedDate.getMonth() + 1).toString().padStart(2, "0")}-01`),
        where("date", "<=", `${year}-${(selectedDate.getMonth() + 1).toString().padStart(2, "0")}-31`)
      );

      budgetQuery = query(
        budgetQuery,
        where("userId", "==", uid),
        where("type", "==", "monthly"),
        where("month", "==", monthName),
        where("year", "==", year)
      );
    } else if (viewType === "yearly") {
      incomeQuery = query(
        incomeQuery,
        where("userId", "==", uid),
        where("date", ">=", new Date(year, 0, 1)),
        where("date", "<=", new Date(year, 11, 31))
      );

      expenseQuery = query(
        expenseQuery,
        where("userId", "==", uid),
        where("date", ">=", `${year}-01-01`),
        where("date", "<=", `${year}-12-31`)
      );

      budgetQuery = query(
        budgetQuery,
        where("userId", "==", uid),
        where("type", "==", "yearly"),
        where("year", "==", year)
      );
    } else {
      incomeQuery = query(incomeQuery, where("userId", "==", uid));
      expenseQuery = query(expenseQuery, where("userId", "==", uid));
      budgetQuery = query(budgetQuery, where("userId", "==", uid));
    }

    const incomeSnapshot = await getDocs(incomeQuery);
    const expenseSnapshot = await getDocs(expenseQuery);
    const budgetSnapshot = await getDocs(budgetQuery);

    let incomeTotal = 0;
    incomeSnapshot.forEach(doc => incomeTotal += Number(doc.data().amount || 0));
    setTotalIncome(incomeTotal);

    let expenseTotal = 0;
    expenseSnapshot.forEach(doc => expenseTotal += Number(doc.data().amount || 0));
    setTotalExpenses(expenseTotal);

    let budgetAmount = 0;
    budgetSnapshot.forEach(doc => {
      const data = doc.data();
      budgetAmount = data.amount; // override with latest found
    });
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
