import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [monthlyData, setMonthlyData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
      const selectedMonth = formatMonthYear(currentMonth);

      for (const docSnap of usersSnapshot.docs) {
        const user = docSnap.data();
        const uid = user.uid;
        userData.push(user);

        let incomeTotal = 0;
        let expenseTotal = 0;

        // Fetch incomes for this user
        const incomeSnap = await getDocs(collection(db, 'users', uid, 'incomes'));
        incomeSnap.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.date;

          if (timestamp?.toDate) {
            const incomeDate = timestamp.toDate();
            const incomeMonth = `${incomeDate.getFullYear()}-${String(incomeDate.getMonth() + 1).padStart(2, '0')}`;
            if (incomeMonth === selectedMonth) {
              incomeTotal += Number(data.amount) || 0;
            }
          }
        });

        // Fetch expenses for this user
        const expenseSnap = await getDocs(collection(db, 'users', uid, 'expenses'));
        expenseSnap.forEach((doc) => {
          const data = doc.data();
          const dateStr = data.date; // Expected format: 'YYYY-MM-DD'

          if (typeof dateStr === 'string') {
            const [year, month] = dateStr.split('-');
            const expenseMonth = `${year}-${month}`;
            if (expenseMonth === selectedMonth) {
              expenseTotal += Number(data.amount) || 0;
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

      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">UID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => changeMonth(-1)} className="px-2">&lt;</button>
                  {formatMonthYear(currentMonth)}
                  <button onClick={() => changeMonth(1)} className="px-2">&gt;</button>
                </div>
              </th>
              <th className="border p-2 text-center">Income (TK)</th>
              <th className="border p-2 text-center">Expense (TK)</th>
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
