import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const formatMonth = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userList = [];

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const uid = user.uid;

        const incomeSnap = await getDocs(collection(db, 'users', uid, 'income'));
        const incomeTotal = incomeSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          if (data.date?.toDate) {
            const incomeDate = data.date.toDate();
            if (formatMonth(incomeDate) === formatMonth(selectedMonth)) {
              return sum + (data.amount || 0);
            }
          }
          return sum;
        }, 0);

        const expenseSnap = await getDocs(collection(db, 'users', uid, 'expenses'));
        const expenseTotal = expenseSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          if (data.date) {
            try {
              const expenseDate = new Date(data.date);
              if (formatMonth(expenseDate) === formatMonth(selectedMonth)) {
                return sum + (data.amount || 0);
              }
            } catch (err) {
              console.warn('Invalid expense date format:', data.date);
            }
          }
          return sum;
        }, 0);

        userList.push({
          ...user,
          incomeTotal,
          expenseTotal,
        });
      }

      console.log('User list with totals:', userList);
      setUsers(userList);
    };

    fetchData();
  }, [selectedMonth]);

  const changeMonth = (direction) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="mb-4 flex items-center space-x-2">
        <button
          onClick={() => changeMonth(-1)}
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
        >
          &lt;
        </button>
        <span className="font-semibold">
          {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
        >
          &gt;
        </button>
      </div>

      <table className="w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">UID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Month</th>
            <th className="border p-2">Income (TK)</th>
            <th className="border p-2">Expense (TK)</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid}>
              <td className="border p-2">{user.uid}</td>
              <td className="border p-2">{user.firstName} {user.lastName}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{formatMonth(selectedMonth)}</td>
              <td className="border p-2">{user.incomeTotal}</td>
              <td className="border p-2">{user.expenseTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
