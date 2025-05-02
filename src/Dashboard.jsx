import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import BudgetProgressBar from "./components/BudgetProgressBar";
import IncomeExpensePieChart from "./components/IncomeExpensePieChart";

const Dashboard = () => {
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [yearlyBudget, setYearlyBudget] = useState(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [budgetType, setBudgetType] = useState("");

  useEffect(() => {
    const fetchData = async (userId) => {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const incomeSnapshot = await getDocs(
        query(
          collection(db, "income"),
          where("userId", "==", userId),
          where("month", "==", currentMonth),
          where("year", "==", currentYear)
        )
      );
      let income = 0;
      incomeSnapshot.forEach((doc) => {
        income += Number(doc.data().amount);
      });
      setTotalIncome(income);

      const expenseSnapshot = await getDocs(
        query(
          collection(db, "expenses"),
          where("userId", "==", userId),
          where("month", "==", currentMonth),
          where("year", "==", currentYear)
        )
      );
      let expenses = 0;
      expenseSnapshot.forEach((doc) => {
        expenses += Number(doc.data().amount);
      });
      setTotalExpenses(expenses);

      const budgetSnapshot = await getDocs(
        query(
          collection(db, "budgets"),
          where("userId", "==", userId)
        )
      );
      budgetSnapshot.forEach((doc) => {
        const budget = doc.data();
        if (budget.type === "monthly" && budget.month === currentMonth && budget.year === currentYear) {
          setMonthlyBudget(budget.amount);
          setBudgetType("monthly");
        } else if (budget.type === "yearly" && budget.year === currentYear) {
          setYearlyBudget(budget.amount);
          setBudgetType("yearly");
        }
      });
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const currentBudget = budgetType === "monthly" ? monthlyBudget : yearlyBudget;
  const remainingIncome = totalIncome - totalExpenses;

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p><strong>Total Income:</strong> TK {totalIncome}</p>
      <p><strong>Total Expenses:</strong> TK {totalExpenses}</p>
      <p><strong>Remaining Income:</strong> TK {remainingIncome}</p>
      <p><strong>Budget Type:</strong> {budgetType}</p>
      <p><strong>Budget Amount:</strong> TK {currentBudget}</p>

      <BudgetProgressBar
        totalExpenses={totalExpenses}
        budget={currentBudget}
      />

      <IncomeExpensePieChart
        income={totalIncome}
        expenses={totalExpenses}
      />
    </div>
  );
};

export default Dashboard;
