import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

const formatMonth = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const changeMonth = (offset) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setSelectedMonth(newMonth);
  };

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userList = [];

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        const uid = user.uid;

        const incomeSnap = await getDocs(collection(db, 'users', uid, 'incomes'));
        const incomeTotal = incomeSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          if (data.date?.toDate) {
            const month = formatMonth(data.date.toDate());
            if (month === formatMonth(selectedMonth)) {
              return sum + (data.amount || 0);
            }
          }
          return sum;
        }, 0);

        const expenseSnap = await getDocs(collection(db, 'users', uid, 'expenses'));
        const expenseTotal = expenseSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          if (data.date) {
            const month = data.date.slice(0, 7);
            if (month === formatMonth(selectedMonth)) {
              return sum + (data.amount || 0);
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

      setUsers(userList);
    };

    fetchData();
  }, [selectedMonth]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button
          onClick={() => {
            import('firebase/auth').then(({ getAuth, signOut }) => {
              const auth = getAuth();
              signOut(auth);
            });
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-2">All Users</h3>

      <div className="flex items-center mb-2 space-x-2">
        <button
          onClick={() => changeMonth(-1)}
          className="bg-gray-300 px-2 py-1 rounded"
        >
          &lt;
        </button>
        <span className="text-lg font-medium">
          {formatMonth(selectedMonth)}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="bg-gray-300 px-2 py-1 rounded"
        >
          &gt;
        </button>
      </div>

      <div className="overflow-auto">
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">UID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Month</th>
              <th className="border p-2">Monthly Income</th>
              <th className="border p-2">Monthly Expense</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid}>
                <td className="border p-2">{user.uid}</td>
                <td className="border p-2">{user.firstName} {user.lastName}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{formatMonth(selectedMonth)}</td>
                <td className="border p-2">TK {user.incomeTotal}</td>
                <td className="border p-2">TK {user.expenseTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
