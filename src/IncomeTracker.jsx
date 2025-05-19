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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddForm, setShowAddForm] = useState(false);

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
        collection(db, 'income'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const incomesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: new Date(doc.data().date.seconds * 1000),
        }))
        .filter(income => income.date.getFullYear() === selectedYear)
        .sort((a, b) => b.date - a.date);

      setIncomes(incomesData);
    };

    fetchIncomes();
  }, [currentUser, selectedYear]);

  const handleAddIncome = async (income) => {
    const incomeWithUser = {
      ...income,
      userId: currentUser.uid,
      date: income.date instanceof Date ? income.date : new Date(income.date),
    };
    const docRef = await addDoc(collection(db, 'income'), incomeWithUser);
    setIncomes(prev =>
      [
        { ...incomeWithUser, id: docRef.id },
        ...prev,
      ].sort((a, b) => b.date - a.date)
    );
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'income', id));
    setIncomes(prev => prev.filter(income => income.id !== id));
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleUpdate = async (id, updatedIncome) => {
    const updatedWithDate = {
      ...updatedIncome,
      date: updatedIncome.date instanceof Date ? updatedIncome.date : new Date(updatedIncome.date),
    };
    await updateDoc(doc(db, 'income', id), updatedWithDate);
    setIncomes(prev =>
      prev
        .map(inc => (inc.id === id ? { ...inc, ...updatedWithDate } : inc))
        .sort((a, b) => b.date - a.date)
    );
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">


      <div className="text-center mb-6">
  <button
    onClick={() => setShowAddForm(true)}
    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold shadow"
  >
    + Add Income
  </button>
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


      <div className="mt-8 max-w-4xl mx-auto bg-white shadow-md rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Incomes - {selectedYear}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="px-3 py-1 border rounded hover:bg-gray-200"
            >
              &lt;
            </button>
            <span className="font-medium">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="px-3 py-1 border rounded hover:bg-gray-200"
            >
              &gt;
            </button>
          </div>
        </div>

        {incomes.length === 0 ? (
          <p className="text-gray-500 text-center">No incomes for {selectedYear}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2 text-left">Title</th>
                  <th className="border px-4 py-2 text-left">Date</th>
                  <th className="border px-4 py-2 text-right">Amount (TK)</th>
                  <th className="border px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income.id} className="border-t">
                    {editingId === income.id ? (
                      <td colSpan="4">
                        <EditIncomeForm
                          income={income}
                          onSave={(updatedIncome) => handleUpdate(income.id, updatedIncome)}
                          onCancel={() => setEditingId(null)}
                        />
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-2">{income.title}</td>
                        <td className="px-4 py-2">
                          {income.date.toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-2 text-right">{income.amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right space-x-2">
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

  if (!title.trim() || !date || amount === '') {
    alert('All fields are required.');
    return;
  }

  const amountValue = parseFloat(amount);
  if (isNaN(amountValue) || amountValue <= 0) {
    alert('Amount must be a positive number.');
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
