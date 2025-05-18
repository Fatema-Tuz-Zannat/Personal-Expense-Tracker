import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import PredictExpenses from './PredictExpenses';

const UserProfile = () => {
  const user = auth.currentUser;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPrediction, setShowPrediction] = useState(false); // 👈 toggle prediction chart

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
      }

      setEmail(user.email || '');
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);

    try {
      await setDoc(userRef, {
        firstName,
        lastName,
        email,
      });
      alert('Profile updated successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  if (loading) {
    return <div className="p-4">Loading profile...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded shadow bg-white">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>

      <label className="block mb-2 font-medium">First Name</label>
      <input
        type="text"
        className="border p-2 rounded w-full mb-4"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />

      <label className="block mb-2 font-medium">Last Name</label>
      <input
        type="text"
        className="border p-2 rounded w-full mb-4"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />

      <label className="block mb-2 font-medium">Email (cannot be changed)</label>
      <input
        type="email"
        className="border p-2 rounded w-full mb-6 bg-gray-100"
        value={email}
        disabled
      />

      <div className="flex gap-4 flex-wrap mt-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Save
        </button>

        <button
          onClick={() => setShowPrediction(true)}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Predict for Next Month
        </button>
      </div>

      {showPrediction && (
        <PredictExpenses onClose={() => setShowPrediction(false)} />
      )}
    </div>
  );
};

export default UserProfile;
