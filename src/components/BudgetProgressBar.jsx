import React from "react";

const BudgetProgressBar = ({ totalExpenses, budget }) => {
  if (!budget || budget === 0) return <p>No budget set.</p>;

  const percentageUsed = Math.min((totalExpenses / budget) * 100, 100);

  return (
    <div className="budget-progress">
      <p><strong>Budget Usage:</strong> {percentageUsed.toFixed(1)}%</p>
      <div style={{ backgroundColor: "#ddd", borderRadius: "8px", height: "24px", width: "100%" }}>
        <div
          style={{
            width: `${percentageUsed}%`,
            backgroundColor: percentageUsed > 70 ? "red" : "green",
            height: "100%",
            borderRadius: "8px",
            transition: "width 0.4s ease"
          }}
        />
      </div>
    </div>
  );
};

export default BudgetProgressBar;
