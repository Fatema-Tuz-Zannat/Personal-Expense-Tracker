import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import PredictExpenses from './PredictExpenses';
import { signOut } from 'firebase/auth';
import "./user.css";

const UserProfile = ({ onClose }) => {
  const user = auth.currentUser;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditingFirst, setIsEditingFirst] = useState(false);
  const [isEditingLast, setIsEditingLast] = useState(false);


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
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };
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
<div className="user-profile-container">
  {    <div className="max-w-md mx-auto mt-8 p-6 border rounded shadow bg-white">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>

      <label className="block mb-2 font-medium">First Name</label>
<div className="flex items-center mb-4 gap-2">
  <input
    type="text"
    className="border p-2 rounded w-full"
    value={firstName}
    readOnly={!isEditingFirst}
    onChange={(e) => setFirstName(e.target.value)}
  />
  <button
    type="button"
    onClick={() => setIsEditingFirst(!isEditingFirst)}
    className="text-gray-600 hover:text-black focus:outline-none bg-transparent"
    style={{ padding: 0 }}
  >
    ✏️
  </button>
</div>


<label className="block mb-2 font-medium">Last Name</label>
<div className="flex items-center mb-4 gap-2">
  <input
    type="text"
    className="border p-2 rounded w-full"
    value={lastName}
    readOnly={!isEditingLast}
    onChange={(e) => setLastName(e.target.value)}
  />
  <button
    type="button"
    onClick={() => setIsEditingLast(!isEditingLast)}
    className="text-gray-600 hover:text-black focus:outline-none bg-transparent"
    style={{ padding: 0 }}
  >
    ✏️
  </button>
</div>



      <div className="bottom-button">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Save
        </button>

       <button
        onClick={() => setShowModal(true)}
        className="bg-purple-600 text-white py-2 px-4 rounded mt-4 ml-2"
        >
        Predict for Next Month
       </button>
       <button onClick={handleLogout}>Logout</button>
      <button
      onClick={onClose}
      className="absolute top-2 right-2 text-gray-600 hover:text-black" 
      >
      ✖
      </button>
      </div>
      {showModal && <PredictExpenses onClose={() => setShowModal(false)} />}
      </div>
    }
</div>
  );
};

export default UserProfile;
