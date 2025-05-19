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
import DashboardHeaderNav from './DashboardHeaderNav'; 

const IncomeTracker = () => {
  const [incomes, setIncomes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchIncomes = async () => {
      const q = query(
        collection(db, 'income'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const incomesData = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: new Date(doc.data().date.seconds * 1000),
        }))
        .filter((income) => income.date.getFullYear() === selectedYear)
        .sort((a, b) => b.date - a.date);

      setIncomes(incomesData);
    };

    fetchIncomes();
  }, [currentUser, selectedYear]);

  const handleAddIncome = async (income) => {
    const incomeWithUser = {
      ...income,
      userId: currentUser.uid,
      date: new Date(income.date),
    };
    const docRef = await addDoc(collection(db, 'income'), incomeWithUser);
    setIncomes((prev) =>
      [{ ...incomeWithUser, id: docRef.id }, ...prev].sort(
        (a, b) => b.date - a.date
      )
    );
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'income', id));
    setIncomes((prev) => prev.filter((income) => income.id !== id));
  };

  const handleEdit = (id) => setEditingId(id);

  const handleUpdate = async (id, updatedIncome) => {
    const updatedWithDate = {
      ...updatedIncome,
      date: new Date(updatedIncome.date),
    };
    await updateDoc(doc(db, 'income', id), updatedWithDate);
    setIncomes((prev) =>
      prev
        .map((inc) =>
          inc.id === id ? { ...inc, ...updatedWithDate } : inc
        )
        .sort((a, b) => b.date - a.date)
    );
    setEditingId(null);
  };

  return (
      <div className="min-h-screen bg-gray-100">
    {/* Navigation Bar */}
    <DashboardHeaderNav
      title="Income Tracker"
      onShowReport={() => setShowTodayReport(true)}
      onToggleProfile={() => setShowUserProfile((prev) => !prev)}
      showUserProfile={showUserProfile}
    />
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded shadow font-semibold"
          >
            + Add
          </button>
          <h2 className="text-2xl font-semibold text-center flex-1">
            Income - {selectedYear}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedYear((prev) => prev - 1)}
              className="bg-green-800 text-white px-2 py-1 rounded"
            >
              ◀
            </button>
            <span className="text-lg font-semibold">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear((prev) => prev + 1)}
              className="bg-green-800 text-white px-2 py-1 rounded"
            >
              ▶
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <AddIncomeForm
                onAddIncome={(income) => {
                  handleAddIncome(income);
                  setShowAddForm(false);
                }}
              />
              <button
                onClick={() => setShowAddForm(false)}
                className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {incomes.length === 0 ? (
          <p className="text-gray-500 text-center">
            No incomes for {selectedYear}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="bg-green-200 px-4 py-2 text-left rounded-l-xl">
                    Source
                  </th>
                  <th className="bg-green-200 px-4 py-2 text-left">Date</th>
                  <th className="bg-green-200 px-4 py-2 text-left">Amount</th>
                  <th className="bg-green-200 px-4 py-2 text-left rounded-r-xl">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income.id}>
                    {editingId === income.id ? (
                      <td colSpan="4">
                        <EditIncomeForm
                          income={income}
                          onSave={(updatedIncome) =>
                            handleUpdate(income.id, updatedIncome)
                          }
                          onCancel={() => setEditingId(null)}
                        />
                      </td>
                    ) : (
                      <>
                        <td className="bg-lime-100 px-4 py-2 rounded-l-xl">
                          Salary
                        </td>
                        <td className="bg-teal-100 px-4 py-2">
                          {income.date.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="bg-teal-100 px-4 py-2">
                          {income.amount.toFixed(2)}
                        </td>
                        <td className="bg-teal-100 px-4 py-2 rounded-r-xl">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(income.id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(income.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

const EditIncomeForm = ({ income, onSave, onCancel }) => {
  const [title, setTitle] = useState(income.title);
  const [amount, setAmount] = useState(income.amount);
  const [date, setDate] = useState(
    income.date instanceof Date
      ? income.date.toISOString().split('T')[0]
      : new Date(income.date.seconds * 1000).toISOString().split('T')[0]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    if (!title.trim() || !date || isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter valid income details.');
      return;
    }

    onSave({
      title: title.trim(),
      amount: amountValue,
      date: new Date(date),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-2 p-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border rounded px-3 py-2"
      />
      <div className="flex justify-end space-x-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-600 hover:underline"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default IncomeTracker;
