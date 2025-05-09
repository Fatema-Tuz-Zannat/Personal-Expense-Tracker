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
  
    const selectedDateStr = new Date(selectedDate).toISOString().split('T')[0]; 
  
    const filteredIncomeList = incomeData.filter((income) => {
      const incomeDateObj =
        income.date?.seconds ? new Date(income.date.seconds * 1000) : new Date(income.date);
      const incomeDateStr = incomeDateObj.toISOString().split('T')[0];
      return incomeDateStr === selectedDateStr;
    });
  
    const filteredExpenseList = expenseData.filter((expense) => {
      const expenseDateObj = new Date(expense.date); 
      const expenseDateStr = expenseDateObj.toISOString().split('T')[0];
      return expenseDateStr === selectedDateStr;
    });
  
    setFilteredIncome(filteredIncomeList);
    setFilteredExpenses(filteredExpenseList);
  }, [selectedDate, incomeData, expenseData]);  

  const totalIncome = filteredIncome.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const totalExpenses = filteredExpenses.reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div className="daily-report">
      <h3>Select a Date</h3>
      <Calendar
        onChange={handleDateChange}
        tileClassName={({ date }) => {
          if (date.toDateString() === new Date().toDateString()) return 'highlight-today';
        }}
      />

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <button className="close-btn" onClick={() => setShowPopup(false)}>×</button>
            <h3>Report for {selectedDate.toDateString()}</h3>

            <div className="daily-section">
              <h4>Income (Total: TK {totalIncome})</h4>
              {filteredIncome.length > 0 ? (
                <ul>
                  {filteredIncome.map((income) => (
                    <li key={income.id}>
                      {income.title}: TK {income.amount}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No income records</p>
              )}
            </div>

            <div className="daily-section">
              <h4>Expenses (Total: TK {totalExpenses})</h4>
              {filteredExpenses.length > 0 ? (
                <ul>
                  {filteredExpenses.map((expense) => (
                    <li key={expense.id}>
                      {expense.title}: TK {expense.amount}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No expense records</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
