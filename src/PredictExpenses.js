import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import * as tf from '@tensorflow/tfjs';
import { Bar } from 'react-chartjs-2';

const PredictExpenses = ({ onClose }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const categoryColors = {
    Food: 'rgba(75,192,192,0.6)',
    Rent: 'rgba(255,99,132,0.6)',
    Transportation: 'rgba(153,102,255,0.6)',
    Utilities: 'rgba(54,162,235,0.6)',
    Entertainment: 'rgba(255,206,86,0.6)',
    Shopping: 'rgba(83,102,255,0.6)',
    Healthcare: 'rgba(255,159,64,0.6)',
    Education: 'rgba(52,231,116,0.6)',
    Other: 'rgba(199,199,199,0.6)',
    Total: 'rgba(0,0,0,0.6)'
  };

  const getCategoryColor = (category) => {
    return categoryColors[category] || 'rgba(199,199,199,0.6)';
  };

  const fetchMonthlyCategoryExpenses = async () => {
    try {
      const auth = getAuth();
      const db = getFirestore();
      const user = auth.currentUser;
      
      if (!user) {
        setError("You must be logged in to predict expenses");
        return {};
      }

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
    } catch (err) {
      console.error('Error fetching expense data:', err);
      setError('Failed to fetch expense data');
      return {};
    }
  };

  const trainAndPredict = async (dataObj) => {
    const predictions = {};
    
    try {
      for (const category of Object.keys(dataObj)) {
      
        const monthlyData = Object.entries(dataObj[category])
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, value]) => ({ month, value }));

        if (monthlyData.length < 2) {
          const lastValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].value : 0;
          predictions[category] = lastValue;
          continue;
        }

        const values = monthlyData.map(item => item.value);
        
        const allSame = values.every(val => val === values[0]);
        if (allSame) {
          predictions[category] = values[0];
          continue;
        }

        if (category === 'Rent' || category === 'Utilities') {
          predictions[category] = values[values.length - 1];
          continue;
        }
        
        if (values.length >= 12 && 
            (category === 'Food' || category === 'Entertainment' || 
             category === 'Shopping' || category === 'Transportation')) {
          
          const recent3MonthsAvg = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
          
          const sameMonthLastYear = values[values.length - 12] || recent3MonthsAvg;
          
          predictions[category] = Math.round(recent3MonthsAvg * 0.6 + sameMonthLastYear * 0.4);
          continue;
        }
        
        let trend = 0;
        if (values.length >= 3) {
          const changes = [];
          for (let i = values.length - 3; i < values.length; i++) {
            if (i > 0) {
              changes.push(values[i] - values[i-1]);
            }
          }
          trend = changes.reduce((sum, val) => sum + val, 0) / changes.length;
        }
        
        const weights = [];
        let totalWeight = 0;
        
        for (let i = 0; i < values.length; i++) {
          const weight = Math.max(0.1, (i + 1) / values.length);
          weights.push(weight);
          totalWeight += weight;
        }
        
        let weightedSum = 0;
        for (let i = 0; i < values.length; i++) {
          weightedSum += values[i] * weights[i];
        }
        
        const weightedAvg = weightedSum / totalWeight;
        
        let prediction = weightedAvg + trend;
        
        if (category === 'Healthcare' || category === 'Education' || category === 'Other') {
          const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
          const stdDev = Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
          ) || 1; 
          
          const normalizedValues = values.map(val => (val - mean) / stdDev);
          
          const monthFeatures = monthlyData.map(item => {
            const monthNum = parseInt(item.month.split('-')[1]);
            return monthNum / 12;
          });
          
          const xs = tf.tensor2d(monthlyData.map((_, i) => [
            i / (monthlyData.length - 1), 
            monthFeatures[i] 
          ]));
          
          const ys = tf.tensor1d(normalizedValues);
          
          const model = tf.sequential();
          model.add(tf.layers.dense({ 
            units: 12, 
            activation: 'relu', 
            inputShape: [2],
            kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
          }));
          model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
          model.add(tf.layers.dense({ units: 1 }));
          
          model.compile({ 
            optimizer: tf.train.rmsprop(0.001), 
            loss: 'meanSquaredError' 
          });
          
          let bestLoss = Infinity;
          let patience = 15;
          let counter = 0;
          
          for (let epoch = 0; epoch < 150; epoch++) {
            const history = await model.fit(xs, ys, { 
              epochs: 1, 
              verbose: 0 
            });
            
            const loss = history.history.loss[0];
            
            if (loss < bestLoss) {
              bestLoss = loss;
              counter = 0;
            } else {
              counter++;
            }
            
            if (counter >= patience) {
              break; 
            }
          }
          
          const nextMonthIndex = monthlyData.length / (monthlyData.length); 
          const lastMonthDate = monthlyData[monthlyData.length - 1].month;
          const [lastYear, lastMonth] = lastMonthDate.split('-').map(Number);
          const nextMonth = lastMonth === 12 ? 1 : lastMonth + 1;
          const nextMonthNormalized = nextMonth / 12;
          
          const input = tf.tensor2d([[nextMonthIndex, nextMonthNormalized]]);
          
          const normalizedPrediction = model.predict(input).dataSync()[0];
          prediction = normalizedPrediction * stdDev + mean;
          
          xs.dispose();
          ys.dispose();
          input.dispose();
        }
        predictions[category] = Math.max(0, Math.round(prediction));
        
        const recent3Avg = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
        if (predictions[category] > recent3Avg * 2) {
          predictions[category] = Math.round(recent3Avg * 1.5);
        }
        
        if (['Food', 'Transportation'].includes(category) && 
            predictions[category] < recent3Avg * 0.5) {
          predictions[category] = Math.round(recent3Avg * 0.75);
        }
      }

      const total = Object.values(predictions).reduce((sum, val) => sum + val, 0);
      predictions['Total'] = total;

      return predictions;
    } catch (err) {
      console.error('Error in prediction:', err);
      setError('Failed to generate predictions');
      return {};
    }
  };

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const categorizedData = await fetchMonthlyCategoryExpenses();
      const predictedValues = await trainAndPredict(categorizedData);
      setPredictionData(predictedValues);
    } catch (err) {
      console.error('Prediction failed:', err);
      setError('Failed to generate predictions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="prediction-container p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Expense Predictions</h2>
      
      <div className="mb-4">
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={handlePredict}
          disabled={isLoading}
        >
          {isLoading ? 'Predicting...' : 'Predict Next Month'}
        </button>
      </div>
      
      {error && (
        <div className="error-message p-3 mb-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {predictionData && Object.keys(predictionData).length > 0 && (
        <div className="prediction-results">
          <h3 className="text-lg font-semibold mb-2">Predicted Expenses for Next Month</h3>
          
          <div className="mb-6" style={{ height: "300px" }}>
            <Bar
              data={{
                labels: Object.keys(predictionData)
                  .filter(cat => cat !== 'Total')
                  .sort((a, b) => predictionData[b] - predictionData[a]),
                datasets: [
                  {
                    label: 'Predicted Amount (TK)',
                    data: Object.keys(predictionData)
                      .filter(cat => cat !== 'Total')
                      .sort((a, b) => predictionData[b] - predictionData[a])
                      .map(cat => predictionData[cat]),
                    backgroundColor: Object.keys(predictionData)
                      .filter(cat => cat !== 'Total')
                      .sort((a, b) => predictionData[b] - predictionData[a])
                      .map(cat => getCategoryColor(cat))
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const value = context.raw || 0;
                        return `${value.toLocaleString()} TK`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
          
          <div className="total-prediction text-center mt-2 mb-4">
            <span className="font-semibold">Total Prediction: </span>
            <span className="text-lg">{predictionData.Total?.toLocaleString()} TK</span>
          </div>
        </div>
      )}
      
      <div className="mt-4 flex justify-end">
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PredictExpenses;