import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import * as tf from '@tensorflow/tfjs';
import { Bar } from 'react-chartjs-2';

const PredictExpenses = ({ onClose }) => {
  const [predictionData, setPredictionData] = useState(null);

  const fetchMonthlyCategoryExpenses = async () => {
    const auth = getAuth();
    const db = getFirestore();
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

    const allSame = monthlyData.every(val => Math.abs(val - monthlyData[0]) < 10); // tolerance = 10
    if (allSame) {
      predictions[category] = Math.round(monthlyData[monthlyData.length - 1]);
      continue;
    }

    const xsRaw = monthlyData.map((_, i) => i);
    const xsTensor = tf.tensor2d(xsRaw, [xsRaw.length, 1]);
    const ysTensor = tf.tensor2d(monthlyData, [monthlyData.length, 1]);

    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [1] }));
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });

    await model.fit(xsTensor, ysTensor, { epochs: 300, verbose: 0 });

    const input = tf.tensor2d([[xsRaw.length]]);
    const predictionTensor = model.predict(input);
    const prediction = (await predictionTensor.data())[0];

    predictions[category] = Math.max(0, Math.round(prediction));

    tf.dispose([xsTensor, ysTensor, input, predictionTensor]);
  }

  return predictions;
};

  const handlePredict = async () => {
    const categorizedData = await fetchMonthlyCategoryExpenses();
    const predicted = await trainAndPredict(categorizedData);
    const total = Object.values(predicted).reduce((sum, val) => sum + val, 0);
    setPredictionData({ ...predicted, Total: total });
  };

  return (
    <>
      <button className="predict-button" onClick={handlePredict}>Predict for Next Month</button>

      {predictionData && (
        <div className="modal">
          <div className="modal-content">
            <h3>Predicted Expenses for Next Month</h3>
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
            <button onClick={onClose} className="absolute top-2 right-2">✖</button>
          </div>
        </div>
      )}
    </>
  );
};

export default PredictExpenses;
