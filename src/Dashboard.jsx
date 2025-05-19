import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import BudgetProgressBar from "./components/BudgetProgressBar";
import IncomeExpensePieChart from "./components/IncomeExpensePieChart";
import CategorizedExpenseBarChart from "./components/CategorizedExpenseBarChart";
import MonthlyTrendsLineChart from "./components/MonthlyTrendsLineChart"; 
import DailyReport from './components/DailyReport';
import DashboardHeaderNav from './DashboardHeaderNav'; 
import welcome from './backgrounds/welcome.png';
import './Dashboard.css';

const Dashboard = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [budget, setBudget] = useState(0);
  const [viewType, setViewType] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [expenseData, setExpenseData] = useState([]);
  const [currentMonthBudget, setCurrentMonthBudget] = useState(0);
  const [incomeData, setIncomeData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
  const headerHeight = document.querySelector('.dashboard-header').offsetHeight;
  const navHeight = document.querySelector('.dashboard-nav').offsetHeight;
  const totalOffset = headerHeight + navHeight;

  document.querySelector('.whole').style.paddingTop = `${totalOffset}px`;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchFinancialData(user.uid, viewType, selectedDate);
        await fetchCurrentMonthBudget(user.uid);
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
    let expenseTotal = 0;
    let todayIncomeList = [];
    let todayExpenseList = [];
    let filteredIncomes = [];
    let filteredExpenses = [];

    incomeSnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date?.toDate?.(); 
      if (viewType === "total" || (date && date >= startDate && date <= endDate)) {
        incomeTotal += Number(data.amount || 0);
        filteredIncomes.push({ ...data, date });
      }
      if (date && date.toDateString() === today) {
        todayIncomeList.push({ title: data.title, amount: data.amount });
      }
    });

    expenseSnapshot.forEach((doc) => {
      const data = doc.data();
      const dateStr = data.date;
      const date = dateStr ? new Date(dateStr) : null;
      if (viewType === "total" || (date && date >= startDate && date <= endDate)) {
        expenseTotal += Number(data.amount || 0);
        filteredExpenses.push({ ...data, date });
      }
      if (date && date.toDateString() === today) {
        todayExpenseList.push({ title: data.title, amount: data.amount });
      }
    });

    let budgetAmount = 0;
    let trends = [];

    budgetSnapshot.forEach((doc) => {
      const data = doc.data();
      if (
        (viewType === "monthly" && data.type === "monthly" && data.month === monthName && data.year === year) ||
        (viewType === "yearly" && data.type === "yearly" && data.year === year)
      ) {
        budgetAmount = data.amount;
      }
    });

    if (viewType === "yearly" || viewType === "total") {
      trends = Array.from({ length: 12 }, (_, i) => {
        const monthStart = new Date(year, i, 1);
        const monthEnd = new Date(year, i + 1, 0, 23, 59, 59);
        const monthName = monthStart.toLocaleString("default", { month: "short" });

        const incomeSum = filteredIncomes
          .filter((item) => item.date >= monthStart && item.date <= monthEnd)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const expenseSum = filteredExpenses
          .filter((item) => item.date && item.date >= monthStart && item.date <= monthEnd)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const monthBudget = budgetSnapshot.docs.find((doc) => {
          const data = doc.data();
          return data.type === "monthly" && data.month === monthStart.toLocaleString("default", { month: "long" }) && data.year === year;
        });

        return {
          month: monthName,
          income: incomeSum,
          expenses: expenseSum,
          budget: monthBudget?.data().amount || 0,
        };
      });
    }

    setIncomeData(filteredIncomes);
    setTotalIncome(incomeTotal);
    setTotalExpenses(expenseTotal);
    setBudget(budgetAmount);
    setExpenseData(filteredExpenses);
    setMonthlyTrends(trends);
  };

  const fetchCurrentMonthBudget = async (uid) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthName = today.toLocaleString("default", { month: "long" });

    const budgetSnapshot = await getDocs(query(collection(db, "budgets"), where("userId", "==", uid)));

    let currentMonthBudgetAmount = 0;
    budgetSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type === "monthly" && data.month === currentMonthName && data.year === currentYear) {
        currentMonthBudgetAmount = data.amount;
      }
    });

    setCurrentMonthBudget(currentMonthBudgetAmount);
  };

  const remaining = totalIncome - totalExpenses;

  return (
    <div className="dashboard-container">
      <DashboardHeaderNav
        title="Dashboard"
      />
      <div className="welcome">
      <div className="wel"> <h2>Welcome to Your Dashboard </h2></div>
      <div className="wel"><img src={welcome} alt="Hi" className="hi-img" /></div>
      </div>
      <div className="whole">
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
        <div className="pie_bar">
          <div className="chart-box">
            <IncomeExpensePieChart income={totalIncome} expenses={totalExpenses} />
          </div>
          <div className="chart-box">
            <CategorizedExpenseBarChart expenseData={expenseData} />
          </div>
          {(viewType === "yearly" || viewType === "total") && monthlyTrends.length > 0 && (
            <div className="chart-box-full">
              <MonthlyTrendsLineChart data={monthlyTrends} />
            </div>
          )}
        </div>
      </div>

      <DailyReport incomeData={incomeData} expenseData={expenseData} />

    </div>
  );
};

export default Dashboard;
