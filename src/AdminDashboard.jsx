import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const user = auth.currentUser;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const currentUser = usersList.find(u => u.id === user.uid);
        if (!currentUser?.isAdmin) {
          alert('Access denied. Admins only.');
          navigate('/');
          return;
        }

        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  if (loading) return <div className="p-4">Loading admin dashboard...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 border rounded shadow bg-white">
      <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">User ID</th>
            <th className="p-2 border">First Name</th>
            <th className="p-2 border">Last Name</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Admin</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="hover:bg-gray-100">
              <td className="p-2 border">{u.id}</td>
              <td className="p-2 border">{u.firstName}</td>
              <td className="p-2 border">{u.lastName}</td>
              <td className="p-2 border">{u.email}</td>
              <td className="p-2 border text-center">{u.isAdmin ? '✔️' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
