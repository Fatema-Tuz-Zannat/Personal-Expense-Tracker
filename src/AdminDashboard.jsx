import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  const adjustMonth = (change) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + change);
    setSelectedDate(newDate);
  };

  useEffect(() => {
  const fetchUserData = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const incomeSnapshot = await getDocs(collection(db, "income"));
    const expenseSnapshot = await getDocs(collection(db, "expenses"));

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth(); 

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

    const allUsers = usersSnapshot.docs.map((doc) => {
      const user = doc.data();
      const uid = user.uid;

      const userIncomes = incomeSnapshot.docs
        .filter((d) => d.data().userId === uid)
        .filter((d) => {
          const date = d.data().date?.toDate?.();
          return date && date >= monthStart && date <= monthEnd;
        });

      const userExpenses = expenseSnapshot.docs
        .filter((d) => d.data().userId === uid)
        .filter((d) => {
          const dateStr = d.data().date;
          const date = dateStr ? new Date(dateStr) : null;
          return date && date >= monthStart && date <= monthEnd;
        });

      const totalIncome = userIncomes.reduce((sum, d) => sum + Number(d.data().amount || 0), 0);
      const totalExpenses = userExpenses.reduce((sum, d) => sum + Number(d.data().amount || 0), 0);

      return {
        name: user.name || "Unknown",
        email: user.email,
        uid: uid,
        totalIncome,
        totalExpenses,
      };
    });

    setUsers(allUsers);
  };

    fetchUserData();
  }, [selectedDate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const currentMonthName = selectedDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="top-bar">
        <button onClick={handleLogout}>Logout</button>
        <div className="month-navigation">
          <button onClick={() => adjustMonth(-1)}>{"<"}</button>
          <span>{currentMonthName}</span>
          <button onClick={() => adjustMonth(1)}>{">"}</button>
        </div>
      </div>

      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>UID</th>
            <th>Total Income</th>
            <th>Total Expenses</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.uid}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.uid}</td>
              <td>TK {u.totalIncome}</td>
              <td>TK {u.totalExpenses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
