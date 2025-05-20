import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import logo from './backgrounds/logo.png';
import user from './backgrounds/user.png';
import expense from './backgrounds/expense.png';
import income from './backgrounds/income.png';
import report from './backgrounds/report.png';
import bgt from './backgrounds/budget.png';
import dash from './backgrounds/dash.png';
import UserProfile from './UserProfile';

const DashboardHeaderNav = ({ title = "Dashboard", onShowReport }) => {
  const navigate = useNavigate();
  const [showUserProfile, setShowUserProfile] = useState(false); 

  const handleToggleProfile = () => {
    setShowUserProfile(prev => !prev);
  };

  return (
    <>
      <div className="dashboard-header">
        <div className="logo-title">
          <img src={logo} alt="PET Logo" className="logo-img" />
          <h1 className="dashboard-title">{title}</h1>
        </div>
      </div>

      <div className="dashboard-nav">
        <button onClick={() => navigate("/dashboard")}><img src={dash} alt="dash" className="icon" />Dashboard</button>
        <button onClick={() => navigate("/income")}><img src={income} alt="In" className="icon" />Income</button>
        <button onClick={() => navigate("/expenses")}><img src={expense} alt="Ex" className="icon" />Expense</button>
        <button onClick={() => navigate("/budgets")}><img src={bgt} alt="Bgt" className="icon" />Budget</button>
        <button onClick={onShowReport}><img src={report} alt="Rpt" className="icon" />Today's Report</button>
        <button onClick={handleToggleProfile}><img src={user} alt="User" className="icon" />Profile</button>
      </div>

      <div className={`user-profile-slide ${showUserProfile ? 'open' : ''}`}>
        <UserProfile onClose={handleToggleProfile} />
      </div>
    </>
  );
};

export default DashboardHeaderNav;
