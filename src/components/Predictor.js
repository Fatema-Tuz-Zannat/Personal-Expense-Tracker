import React, { useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import * as tf from '@tensorflow/tfjs';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Predictor = ({ userId }) => {
  const [predictions, setPredictions] = useState(null);

  const fetchData = async () => {
    const db = getFirestore();
    const q = query(collection(db, 'monthlyCategoricalExpenses'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const data = {};

    querySnapshot.forEach(doc => {
      const month = doc.id;
      const d = doc.data();
      Object.keys(d).forEach(key => {
        if (key !== 'userId') {
          if (!data[key]) data[key] = [];
          data[key].push({ month, value: d[key] });
        }
      });
    });

    return data;
  };

  const trainAndPredict = async () => {
    const rawData = await fetchData();
    const nextMonthPredictions = {};

    for (const [category, records] of Object.entries(rawData)) {
      const values = records
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((r, i) => ({ x: i + 1, y: r.value }));

      const xs = tf.tensor1d(values.map(d => d.x));
      const ys = tf.tensor1d(values.map(d => d.y));

      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

      await model.fit(xs, ys, { epochs: 200 });

      const nextX = values.length + 1;
      const prediction = model.predict(tf.tensor2d([nextX], [1, 1]));
      const value = await prediction.data();
      nextMonthPredictions[category] = parseFloat(value[0].toFixed(2));
    }

    setPredictions(nextMonthPredictions);
  };

  const chartData = predictions
    ? {
        labels: Object.keys(predictions),
        datasets: [
          {
            label: 'Predicted Next Month Expenses',
            data: Object.values(predictions),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      }
    : null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <button onClick={trainAndPredict}>Predict Next Month</button>
      {predictions && (
        <div style={{ marginTop: '2rem' }}>
          <Bar data={chartData} />
        </div>
      )}
    </div>
  );
};

export default Predictor;
