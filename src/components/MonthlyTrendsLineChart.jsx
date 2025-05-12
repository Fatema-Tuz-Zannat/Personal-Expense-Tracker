import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MonthlyTrendsChart = ({ data }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p>No monthly trend data available.</p>;
  }

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#82ca9d" name="Income" />
          <Line type="monotone" dataKey="expenses" stroke="#ff6b6b" name="Expenses" />
          <Line type="monotone" dataKey="budget" stroke="#8884d8" name="Budget" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyTrendsChart;
