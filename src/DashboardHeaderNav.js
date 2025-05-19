import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './backgrounds/logo.png';
import user from './backgrounds/user.png';
import expense from './backgrounds/expense.png';
import income from './backgrounds/income.png';
import report from './backgrounds/report.png';
import bgt from './backgrounds/budget.png';
import ch from './backgrounds/check.png';
import UserProfile from './UserProfile';

const DashboardHeaderNav = ({
  title = "Dashboard",
  onToggleProfile,
  showUserProfile,
  todayIncome,
  todayExpenses,
  currentMonthBudget,
  budgetRemaining,
  showTodayReport,
  onCloseReport
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="dashboard-header">
        <div className="logo-title">
          <img src={logo} alt="PET Logo" className="logo-img" />
          <h1 className="dashboard-title">{title}</h1>
        </div>
      </div>

      <div className="dashboard-nav">
        <button onClick={() => navigate("/income")}><img src={income} alt="In" className="icon" />Income</button>
        <button onClick={() => navigate("/expenses")}><img src={expense} alt="Ex" className="icon" />Expense</button>
        <button onClick={() => navigate("/budgets")}><img src={bgt} alt="Bgt" className="icon" />Budget</button>
        <button onClick={onCloseReport}><img src={report} alt="Rpt" className="icon" />Today's Report</button>
        <button onClick={onToggleProfile}><img src={user} alt="User" className="icon" />Profile</button>
      </div>

      <div className={`user-profile-slide ${showUserProfile ? 'open' : ''}`}>
        <UserProfile onClose={onToggleProfile} />
      </div>

      {showTodayReport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <img src={ch} alt="Decoration" className="popup-image" />
            <h3>Today's Report</h3>
            <h4>Income</h4>
            <ul>
              {todayIncome.map((item, index) => (
                <li key={index}>{item.title}: TK {item.amount}</li>
              ))}
            </ul>
            <h4>Expenses</h4>
            <ul>
              {todayExpenses.map((item, index) => (
                <li key={index}>{item.category || item.title}: TK {item.amount}</li>
              ))}
            </ul>
            <p>Monthly Budget: TK {currentMonthBudget}</p>
            <p>Remaining Budget: TK {budgetRemaining}</p>
            <button onClick={onCloseReport}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardHeaderNav;
