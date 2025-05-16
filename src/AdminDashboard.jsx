import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userData = [];
      let totalIncome = 0;
      let totalExpenses = 0;

      for (const docSnap of usersSnapshot.docs) {
        const user = docSnap.data();
        userData.push(user);

        const uid = user.uid;

        const incomeSnap = await getDocs(collection(db, 'users', uid, 'incomes'));
        incomeSnap.forEach(doc => {
          totalIncome += doc.data().amount || 0;
        });

        const expenseSnap = await getDocs(collection(db, 'users', uid, 'expenses'));
        expenseSnap.forEach(doc => {
          totalExpenses += doc.data().amount || 0;
        });
      }

      setUsers(userData);
      setAnalytics({
        totalUsers: userData.length,
        totalIncome,
        totalExpenses,
      });
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 shadow rounded">Total Users: {analytics.totalUsers}</div>
        <div className="bg-white p-4 shadow rounded">Total Income: TK {analytics.totalIncome}</div>
        <div className="bg-white p-4 shadow rounded">Total Expenses: TK {analytics.totalExpenses}</div>
      </div>

      <h3 className="text-xl font-semibold mb-2">All Users:</h3>
      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">UID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td className="border p-2">{user.uid}</td>
                <td className="border p-2">{user.firstName} {user.lastName}</td>
                <td className="border p-2">{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
