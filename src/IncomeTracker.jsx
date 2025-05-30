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
import './IncomeTracker.css';


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
    <DashboardHeaderNav
      title="Income Tracker"
    />
    <div className="mobile"> 
    <div className="in"> 
      <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
      <button
      onClick={() => setShowAddForm(true)}
      style={{
      backgroundColor: "#047857",
      color: "white",
      padding: "8px 20px",
      borderRadius: "6px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      fontWeight: "600",
      border: "none",
      cursor: "pointer"
    }}
  >
    + Add
  </button>

  <h2 style={{ fontSize: "1.5rem", fontWeight: "600", textAlign: "center", flex: 1 }}>
    Income - {selectedYear}
  </h2>

  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <button
      onClick={() => setSelectedYear((prev) => prev - 1)}
      style={{
        backgroundColor: "#065f46", 
        color: "white",
        padding: "4px 10px",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer"
      }}
    >
      ◀
    </button>
    <span style={{ fontSize: "1.125rem", fontWeight: "600" }}>{selectedYear}</span>
    <button
      onClick={() => setSelectedYear((prev) => prev + 1)}
      style={{
        backgroundColor: "#065f46",
        color: "white",
        padding: "4px 10px",
        borderRadius: "4px",
        border: "none",
        cursor: "pointer"
      }}
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
  <p style={{ textAlign: "center", color: "#6B7280" }}>
    No incomes for {selectedYear}.
  </p>
) : (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 12px" }}>
      <thead>
        <tr>
          <th style={{
            backgroundColor: "#BBF7D0",
            padding: "12px 16px",
            textAlign: "left",
            borderTopLeftRadius: "12px",
            borderBottomLeftRadius: "12px"
          }}>Source</th>
          <th style={{ backgroundColor: "#BBF7D0", padding: "12px 16px", textAlign: "left" }}>Date</th>
          <th style={{ backgroundColor: "#BBF7D0", padding: "12px 16px", textAlign: "left" }}>Amount</th>
          <th style={{
            backgroundColor: "#BBF7D0",
            padding: "12px 16px",
            textAlign: "left",
            borderTopRightRadius: "12px",
            borderBottomRightRadius: "12px"
          }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {incomes.map((income) => (
          <tr key={income.id}>
            {editingId === income.id ? (
              <td colSpan="4" style={{ backgroundColor: "#ECFDF5", padding: "16px", borderRadius: "12px" }}>
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
                <td style={{
                  backgroundColor: "#ECFDF5",
                  padding: "12px 16px",
                  borderTopLeftRadius: "12px",
                  borderBottomLeftRadius: "12px"
                }}>
                  {income.title || "Salary"}
                </td>
                <td style={{ backgroundColor: "#D1FAE5", padding: "12px 16px" }}>
                  {income.date.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td style={{ backgroundColor: "#D1FAE5", padding: "12px 16px" }}>
                  TK{income.amount.toFixed(2)}
                </td>
                <td style={{
                  backgroundColor: "#D1FAE5",
                  padding: "12px 16px",
                  display: "flex",
                  gap: "8px",
                  borderTopRightRadius: "12px",
                  borderBottomRightRadius: "12px"
                }}>
                  <button
                    onClick={() => handleEdit(income.id)}
                    style={{
                      backgroundColor: "#3B82F6",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(income.id)}
                    style={{
                      backgroundColor: "#EF4444",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer"
                    }}
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
