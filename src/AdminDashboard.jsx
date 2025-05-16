import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({});
  const navigate = useNavigate();

  const formatMonthYear = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  useEffect(() => {
    const fetchUsersAndData = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userData = [];
      const monthData = {};

      for (const docSnap of usersSnapshot.docs) {
        const user = docSnap.data();
        const uid = user.uid;
        userData.push(user);

        let incomeTotal = 0;
        let expenseTotal = 0;
        const selectedMonth = formatMonthYear(currentMonth);

        const incomeSnap = await getDocs(collection(db, 'users', uid, 'incomes'));
        incomeSnap.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.date;
          if (timestamp?.toDate) {
            const incomeDate = timestamp.toDate();
            const incomeMonth = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}`;
            if (incomeMonth === selectedMonth) {
              incomeTotal += data.amount || 0;
            }
          }
        });

        const expenseSnap = await getDocs(collection(db, 'users', uid, 'expenses'));
        expenseSnap.forEach((doc) => {
          const data = doc.data();
          const dateString = data.date; 
          if (typeof dateString === 'string') {
            const [year, month] = dateString.split('-');
            const expenseMonth = `${year}-${month}`;
            if (expenseMonth === selectedMonth) {
              expenseTotal += data.amount || 0;
            }
          }
        });

        monthData[uid] = {
          income: incomeTotal,
          expense: expenseTotal,
        };
      }

      setUsers(userData);
      setMonthlyData(monthData);
    };

    fetchUsersAndData();
  }, [currentMonth]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-2">All Users:</h3>
      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">UID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2 flex items-center justify-center gap-2">
                <button onClick={() => changeMonth(-1)}>&lt;</button>
                Month: {formatMonthYear(currentMonth)}
                <button onClick={() => changeMonth(1)}>&gt;</button>
              </th>
              <th className="border p-2">Monthly Income (TK)</th>
              <th className="border p-2">Monthly Expense (TK)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const data = monthlyData[user.uid] || { income: 0, expense: 0 };
              return (
                <tr key={user.uid}>
                  <td className="border p-2">{user.uid}</td>
                  <td className="border p-2">{user.firstName} {user.lastName}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2 text-center">{formatMonthYear(currentMonth)}</td>
                  <td className="border p-2 text-center">{data.income}</td>
                  <td className="border p-2 text-center">{data.expense}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
