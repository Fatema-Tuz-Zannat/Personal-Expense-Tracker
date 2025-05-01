import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AddIncomeForm from './AddIncomeForm';

const IncomeTracker = () => {
  const [incomes, setIncomes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchIncomes = async () => {
      const q = query(
        collection(db, 'incomes'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const incomesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIncomes(incomesData);
    };

    fetchIncomes();
  }, [currentUser]);

  const handleAddIncome = async (income) => {
    const incomeWithUser = {
      ...income,
      userId: currentUser.uid,
    };
    const docRef = await addDoc(collection(db, 'incomes'), incomeWithUser);
    setIncomes(prev => [{ ...incomeWithUser, id: docRef.id }, ...prev]);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'incomes', id));
    setIncomes(prev => prev.filter(income => income.id !== id));
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleUpdate = async (id, updatedIncome) => {
    await updateDoc(doc(db, 'incomes', id), updatedIncome);
    setIncomes(prev =>
      prev.map(inc =>
        inc.id === id ? { ...inc, ...updatedIncome } : inc
      )
    );
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Personal Income Tracker</h1>

      <AddIncomeForm onAddIncome={handleAddIncome} />

      <div className="mt-8 max-w-md mx-auto bg-white shadow-md rounded-md p-4">
        <h2 className="text-xl font-semibold mb-4">Incomes</h2>
        {incomes.length === 0 ? (
          <p className="text-gray-500 text-center">No incomes added yet.</p>
        ) : (
          <ul className="space-y-3">
            {incomes.map((income) => (
              <li
                key={income.id}
                className="flex justify-between items-center border-b pb-2"
              >
                {editingId === income.id ? (
                  <EditIncomeForm
                    income={income}
                    onSave={(updatedIncome) =>
                      handleUpdate(income.id, updatedIncome)
                    }
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div>
                      <p className="font-medium">{income.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(income.date.seconds * 1000).toDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">TK{income.amount.toFixed(2)}</p>
                      <div className="flex gap-2 text-sm mt-1">
                        <button
                          onClick={() => handleEdit(income.id)}
                          className="text-blue-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const EditIncomeForm = ({ income, onSave, onCancel }) => {
  const [title, setTitle] = useState(income.title);
  const [amount, setAmount] = useState(income.amount);
  const [date, setDate] = useState(
    new Date(income.date.seconds * 1000).toISOString().split('T')[0]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title,
      amount: parseFloat(amount),
      date: new Date(date),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded p-1"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border rounded p-1"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full border rounded p-1"
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:underline"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="text-sm text-green-600 font-semibold hover:underline"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default IncomeTracker;
