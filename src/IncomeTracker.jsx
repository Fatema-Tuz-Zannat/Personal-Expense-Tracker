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

// ... previous imports remain the same

const IncomeTracker = () => {
  const [incomes, setIncomes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
      const allIncomes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filtered = allIncomes.filter((income) => {
        const incomeDate = income.date?.seconds
          ? new Date(income.date.seconds * 1000)
          : new Date(income.date);
        return incomeDate.getFullYear() === selectedYear;
      });

      const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      setIncomes(sorted);
    };

    fetchIncomes();
  }, [currentUser, selectedYear]);

  const handleAddIncome = async (income) => {
    const incomeWithUser = {
      ...income,
      userId: currentUser.uid,
    };
    const docRef = await addDoc(collection(db, 'income'), incomeWithUser);
    const addedIncome = { ...incomeWithUser, id: docRef.id };

    const incomeYear = new Date(income.date).getFullYear();
    if (incomeYear === selectedYear) {
      setIncomes(prev => [addedIncome, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'income', id));
    setIncomes(prev => prev.filter(income => income.id !== id));
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleUpdate = async (id, updatedIncome) => {
    await updateDoc(doc(db, 'income', id), updatedIncome);
    setIncomes(prev =>
      prev
        .map(inc =>
          inc.id === id ? { ...inc, ...updatedIncome } : inc
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    );
    setEditingId(null);
  };

  const yearlyTotal = incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Personal Expense Tracker</h1>

      <AddIncomeForm onAddIncome={handleAddIncome} />

      <div className="flex justify-center items-center gap-4 mt-8 mb-4">
        <button
          onClick={() => setSelectedYear(prev => prev - 1)}
          className="text-xl font-bold px-2 hover:text-blue-600"
        >
          &lt;
        </button>
        <span className="text-lg font-semibold">{selectedYear}</span>
        <button
          onClick={() => setSelectedYear(prev => prev + 1)}
          className="text-xl font-bold px-2 hover:text-blue-600"
        >
          &gt;
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-md p-4">
        <h2 className="text-xl font-semibold mb-4">Incomes</h2>
        {incomes.length === 0 ? (
          <p className="text-gray-500 text-center">No incomes added for {selectedYear}.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Amount (TK)</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((income) => (
                    <tr key={income.id} className="border-t">
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
                          <td className="px-4 py-2">{income.title}</td>
                          <td className="px-4 py-2">
                            {new Date(
                              income.date?.seconds
                                ? income.date.seconds * 1000
                                : income.date
                            ).toDateString()}
                          </td>
                          <td className="px-4 py-2 font-semibold">TK{income.amount.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center space-x-2">
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
            <div className="text-right font-bold mt-4">
              Total for {selectedYear}: TK{yearlyTotal.toFixed(2)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


export default IncomeTracker;
