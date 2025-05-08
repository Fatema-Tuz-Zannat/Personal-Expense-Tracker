import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CategorizedExpenseBarChart = ({ expenseData }) => {
  const categoryTotals = {};

  expenseData.forEach((expense) => {
    const category = expense.category || "Uncategorized";
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(expense.amount);
  });

  const data = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: "Expenses by Category (TK)",
        data: Object.values(categoryTotals),
        backgroundColor: "#ff7043",
      },
    ],
  };

  return (
    <div>
      <h3>Expenses by Category</h3>
      <Bar data={data} />
    </div>
  );
};

export default CategorizedExpenseBarChart;
