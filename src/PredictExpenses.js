import React, { useState } from 'react';
import { auth, db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import * as tf from '@tensorflow/tfjs';
import { Bar } from 'react-chartjs-2';

const PredictExpenses = ({ onClose }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMonthlyCategoryExpenses = async () => {
    const user = auth.currentUser;
    if (!user) return {};

    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);

    const categoryData = {};

    snapshot.forEach((doc) => {
      const { category, amount, date } = doc.data();
      const [year, month] = date.split('-');
      const key = `${year}-${month}`;

      if (!categoryData[category]) categoryData[category] = {};
      if (!categoryData[category][key]) categoryData[category][key] = 0;
      categoryData[category][key] += Number(amount);
    });

    return categoryData;
  };

  const trainAndPredict = async (dataObj) => {
    const predictions = {};

    for (const category of Object.keys(dataObj)) {
      const monthlyData = Object.entries(dataObj[category])
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([_, value]) => value);

      if (monthlyData.length < 2) continue;

      const xs = tf.tensor1d(monthlyData.map((_, i) => i));
      const ys = tf.tensor1d(monthlyData);

      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

      await model.fit(xs, ys, { epochs: 200 });

      const nextIndex = monthlyData.length;
      const input = tf.tensor1d([nextIndex]);
      const prediction = model.predict(input).dataSync()[0];

      predictions[category] = Math.max(0, Math.round(prediction));
    }

    return predictions;
  };

  const handlePredict = async () => {
    setLoading(true);
    const categorizedData = await fetchMonthlyCategoryExpenses();
    const predicted = await trainAndPredict(categorizedData);
    const total = Object.values(predicted).reduce((sum, val) => sum + val, 0);
    setPredictionData({ ...predicted, Total: total });
    setLoading(false);
  };

  return (
    <div>
      <button
        className="bg-green-600 text-white py-2 px-4 rounded mt-4"
        onClick={handlePredict}
      >
        Predict for Next Month
      </button>

      {loading && <p className="mt-4">Predicting, please wait...</p>}

      {predictionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative max-w-lg w-full">
            <button onClick={onClose} className="absolute top-2 right-2 text-xl">✖</button>
            <h3 className="text-lg font-bold mb-4">Predicted Expenses for Next Month</h3>
            <Bar
              data={{
                labels: Object.keys(predictionData),
                datasets: [
                  {
                    label: 'Predicted Amount (TK)',
                    data: Object.values(predictionData),
                    backgroundColor: 'rgba(75,192,192,0.6)',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: true },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictExpenses;
