import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './DailyReport.css';

const DailyReport = ({ incomeData, expenseData }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setShowPopup(true);
  };

  useEffect(() => {
    if (!selectedDate) return;

    const filteredIncomeList = incomeData.filter((income) => {
      const incomeDate = new Date(income.date);
      return (
        incomeDate.getDate() === selectedDate.getDate() &&
        incomeDate.getMonth() === selectedDate.getMonth() &&
        incomeDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    const filteredExpenseList = expenseData.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getDate() === selectedDate.getDate() &&
        expenseDate.getMonth() === selectedDate.getMonth() &&
        expenseDate.getFullYear() === selectedDate.getFullYear()
      );
    });

    setFilteredIncome(filteredIncomeList);
    setFilteredExpenses(filteredExpenseList);
  }, [selectedDate, incomeData, expenseData]);

  return (
    <div className="daily-report">
      <h3>Select a Date to View Daily Report</h3>
      <Calendar onClickDay={handleDateChange} />

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Daily Report - {selectedDate.toDateString()}</h3>
            <h4>Income</h4>
            {filteredIncome.length > 0 ? (
              <ul>
                {filteredIncome.map((item, index) => (
                  <li key={index}>{item.title}: TK {item.amount}</li>
                ))}
              </ul>
            ) : (
              <p>No income recorded on this date.</p>
            )}

            <h4>Expenses</h4>
            {filteredExpenses.length > 0 ? (
              <ul>
                {filteredExpenses.map((item, index) => (
                  <li key={index}>{item.category}: TK {item.amount}</li>
                ))}
              </ul>
            ) : (
              <p>No expenses recorded on this date.</p>
            )}

            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
