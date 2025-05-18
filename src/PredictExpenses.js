import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import * as tf from '@tensorflow/tfjs';
import { Bar, Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';

const PredictExpenses = ({ onClose }) => {
  const [predictionData, setPredictionData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState('lstm');
  const [predictionMonths, setPredictionMonths] = useState(1);

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
    return categoryColors[category] || `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},0.6)`;
  };

  const fetchMonthlyCategoryExpenses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
      const monthlyTotals = {};
      let allMonths = new Set();

      snapshot.forEach((doc) => {
        const { category, amount, date } = doc.data();
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1; 
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        
        allMonths.add(key);

        if (!categoryData[category]) categoryData[category] = {};
        if (!categoryData[category][key]) categoryData[category][key] = 0;
        categoryData[category][key] += Number(amount);

        if (!monthlyTotals[key]) monthlyTotals[key] = 0;
        monthlyTotals[key] += Number(amount);
      });

      const sortedMonths = Array.from(allMonths).sort();
      
      const historical = {
        categories: Object.keys(categoryData),
        months: sortedMonths,
        data: {}
      };

      Object.keys(categoryData).forEach(category => {
        historical.data[category] = [];
        
        sortedMonths.forEach(month => {
          historical.data[category].push(categoryData[category][month] || 0);
        });
      });

      historical.categories.push('Total');
      historical.data['Total'] = sortedMonths.map(month => monthlyTotals[month] || 0);
      
      setHistoricalData(historical);
      setIsLoading(false);
      return categoryData;
    } catch (err) {
      console.error('Error fetching expense data:', err);
      setError('Failed to fetch expense data');
      setIsLoading(false);
      return {};
    }
  };

  const trainSimpleModel = async (dataArray) => {
    if (dataArray.length < 2) return null;
    
    const allSame = dataArray.every(val => val === dataArray[0]);
    if (allSame) return dataArray[0];
    
    const xs = tf.tensor1d(dataArray.map((_, i) => i));
    const ys = tf.tensor1d(dataArray);

    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [1] }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });

    await model.fit(xs, ys, { epochs: 200, verbose: 0 });
    
    return model;
  };

  const trainLSTMModel = async (dataArray) => {
    if (dataArray.length < 4) return null; 
    
    const allSame = dataArray.every(val => val === dataArray[0]);
    if (allSame) return dataArray[0];
    
    const sequenceLength = 3;
    const xsData = [];
    const ysData = [];
    
    for (let i = 0; i <= dataArray.length - sequenceLength - 1; i++) {
      const sequence = dataArray.slice(i, i + sequenceLength);
      const target = dataArray[i + sequenceLength];
      xsData.push(sequence);
      ysData.push(target);
    }
    
    if (xsData.length === 0) return null;
    
    const xs = tf.tensor2d(xsData);
    const ys = tf.tensor1d(ysData);
    
    const reshapedXs = xs.reshape([xsData.length, sequenceLength, 1]);
    
    const model = tf.sequential();
    model.add(tf.layers.lstm({
      units: 8,
      inputShape: [sequenceLength, 1],
      returnSequences: false
    }));
    model.add(tf.layers.dense({ units: 1 }));
    
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });
    
    await model.fit(reshapedXs, ys, {
      epochs: 100,
      verbose: 0
    });
    
    return {
      model,
      sequenceLength,
      lastData: dataArray.slice(-sequenceLength)
    };
  };

  const trainSeasonalModel = (dataArray) => {
    if (dataArray.length < 6) return null; 
    const recentAverage = dataArray.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    
    let seasonalFactor = 1;
    if (dataArray.length >= 12) {
      const lastYearAverage = dataArray.slice(-12, -9).reduce((sum, val) => sum + val, 0) / 3;
      if (lastYearAverage > 0) {
        seasonalFactor = recentAverage / lastYearAverage;
      }
    }
    
    let trend = 0;
    if (dataArray.length >= 6) {
      const recent3 = dataArray.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
      const previous3 = dataArray.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
      trend = recent3 - previous3;
    }
    
    return {
      predict: (steps) => {
        const lastValue = dataArray[dataArray.length - 1];
        return lastValue + trend * steps;
      },
      seasonalFactor
    };
  };

  const predictNextMonths = async (model, type, dataArray, steps) => {
    if (!model) return Array(steps).fill(dataArray[dataArray.length - 1] || 0);
    
    let predictions = [];
    
    if (type === 'simple') {
      for (let i = 1; i <= steps; i++) {
        const input = tf.tensor2d([[dataArray.length + i - 1]]);
        const prediction = model.predict(input).dataSync()[0];
        predictions.push(Math.max(0, Math.round(prediction)));
      }
    } 
    else if (type === 'lstm') {
      let currentInput = tf.tensor3d([model.lastData.map(v => [v])]);
      
      for (let i = 0; i < steps; i++) {
        const prediction = model.model.predict(currentInput).dataSync()[0];
        predictions.push(Math.max(0, Math.round(prediction)));
        
        const newInput = [...model.lastData.slice(1), prediction];
        currentInput.dispose();
        currentInput = tf.tensor3d([newInput.map(v => [v])]);
      }
      currentInput.dispose();
    }
    else if (type === 'seasonal') {
      for (let i = 1; i <= steps; i++) {
        const prediction = model.predict(i) * (i % 12 === 0 ? model.seasonalFactor : 1);
        predictions.push(Math.max(0, Math.round(prediction)));
      }
    }
    
    return predictions;
  };

  const trainAndPredict = async (dataObj) => {
    const predictions = {};
    const multiMonthPredictions = {};

    try {
      for (const category of Object.keys(dataObj)) {
        const monthlyData = Object.entries(dataObj[category])
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([_, value]) => value);

        if (monthlyData.length < 2) {
          const lastValue = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : 0;
          predictions[category] = lastValue;
          multiMonthPredictions[category] = Array(predictionMonths).fill(lastValue);
          continue;
        }

        let model;
        let modelType = selectedModel;

        if (modelType === 'simple') {
          model = await trainSimpleModel(monthlyData);
        } 
        else if (modelType === 'lstm') {
          if (monthlyData.length < 4) {
            model = await trainSimpleModel(monthlyData);
            modelType = 'simple';
          } else {
            model = await trainLSTMModel(monthlyData);
          }
        }
        else if (modelType === 'seasonal') {
          model = trainSeasonalModel(monthlyData);
        }

        const monthlyPredictions = await predictNextMonths(
          model, 
          modelType, 
          monthlyData, 
          predictionMonths
        );
        
        multiMonthPredictions[category] = monthlyPredictions;
        
        predictions[category] = monthlyPredictions[0];
      }

      multiMonthPredictions['Total'] = Array(predictionMonths).fill(0);
      Object.keys(multiMonthPredictions).forEach(category => {
        if (category !== 'Total') {
          multiMonthPredictions[category].forEach((val, idx) => {
            multiMonthPredictions['Total'][idx] += val;
          });
        }
      });
      
      predictions['Total'] = multiMonthPredictions['Total'][0];

      return { 
        nextMonth: predictions,
        multiMonth: multiMonthPredictions
      };
    } catch (err) {
      console.error('Error in prediction:', err);
      setError('Failed to generate predictions');
      return { nextMonth: {}, multiMonth: {} };
    }
  };

  const handlePredict = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const categorizedData = await fetchMonthlyCategoryExpenses();
      const { nextMonth, multiMonth } = await trainAndPredict(categorizedData);
      
      setPredictionData({
        nextMonth,
        multiMonth,
        months: Array.from({ length: predictionMonths }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() + i + 1);
          return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        })
      });
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
      
      <div className="controls flex flex-wrap gap-4 mb-4">
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">Prediction Model:</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="simple">Simple Linear</option>
            <option value="lstm">Advanced (LSTM)</option>
            <option value="seasonal">Seasonal</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="block text-sm font-medium mb-1">Months to Predict:</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={predictionMonths}
            onChange={(e) => setPredictionMonths(Number(e.target.value))}
          >
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">12 Months</option>
          </select>
        </div>
        
        <div className="form-group flex items-end">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={handlePredict}
            disabled={isLoading}
          >
            {isLoading ? 'Predicting...' : 'Predict Expenses'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message p-3 mb-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {historicalData && (
        <div className="historical-chart mb-6">
          <h3 className="text-lg font-semibold mb-2">Historical Expense Trends</h3>
          <Line
            data={{
              labels: historicalData.months,
              datasets: historicalData.categories.map(category => ({
                label: category,
                data: historicalData.data[category],
                borderColor: getCategoryColor(category),
                backgroundColor: getCategoryColor(category).replace('0.6', '0.1'),
                borderWidth: 2,
                tension: 0.1,
                hidden: category === 'Total' ? false : true 
              }))
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { 
                  position: 'top',
                  onClick: function(e, legendItem, legend) {
                    const index = legendItem.datasetIndex;
                    const ci = legend.chart;
                    const meta = ci.getDatasetMeta(index);
                    
                    meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                    
                    if (ci.data.datasets[index].label === 'Total') {
                      for (let i = 0; i < ci.data.datasets.length; i++) {
                        if (i !== index) {
                          const otherMeta = ci.getDatasetMeta(i);
                          otherMeta.hidden = meta.hidden === null ? true : null;
                        }
                      }
                    }
                    
                    ci.update();
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const label = context.dataset.label || '';
                      const value = context.parsed.y || 0;
                      return `${label}: ${value.toLocaleString()} TK`;
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Amount (TK)'
                  }
                }
              }
            }}
            height={300}
          />
        </div>
      )}
      
      {predictionData && (
        <div className="prediction-results">
          <h3 className="text-lg font-semibold mb-2">
            Predicted Expenses for {predictionMonths > 1 ? 'Next Months' : 'Next Month'}
          </h3>
          
          <div className="mb-6">
            <h4 className="text-md font-medium mb-1">Next Month Breakdown</h4>
            <Bar
              data={{
                labels: Object.keys(predictionData.nextMonth)
                  .filter(cat => cat !== 'Total')
                  .sort((a, b) => predictionData.nextMonth[b] - predictionData.nextMonth[a]),
                datasets: [
                  {
                    label: `Predicted Amount (TK) for ${predictionData.months[0]}`,
                    data: Object.keys(predictionData.nextMonth)
                      .filter(cat => cat !== 'Total')
                      .sort((a, b) => predictionData.nextMonth[b] - predictionData.nextMonth[a])
                      .map(cat => predictionData.nextMonth[cat]),
                    backgroundColor: Object.keys(predictionData.nextMonth)
                      .filter(cat => cat !== 'Total')
                      .sort((a, b) => predictionData.nextMonth[b] - predictionData.nextMonth[a])
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
                        const value = context.parsed.y || 0;
                        return `${value.toLocaleString()} TK`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Amount (TK)'
                    }
                  }
                }
              }}
              height={250}
            />
            <div className="total-prediction text-center mt-2">
              <span className="font-semibold">Total Prediction: </span>
              <span className="text-lg">{predictionData.nextMonth.Total?.toLocaleString()} TK</span>
            </div>
          </div>
          
          {predictionMonths > 1 && (
            <div className="multi-month-predictions">
              <h4 className="text-md font-medium mb-1">Future Months Forecast</h4>
              <Line
                data={{
                  labels: predictionData.months,
                  datasets: Object.keys(predictionData.multiMonth)
                    .filter(category => {
                      if (category === 'Total') return true;
                      
                      const topCategories = Object.keys(predictionData.nextMonth)
                        .filter(cat => cat !== 'Total')
                        .sort((a, b) => predictionData.nextMonth[b] - predictionData.nextMonth[a])
                        .slice(0, 5);
                        
                      return topCategories.includes(category);
                    })
                    .map(category => ({
                      label: category,
                      data: predictionData.multiMonth[category],
                      borderColor: getCategoryColor(category),
                      backgroundColor: getCategoryColor(category).replace('0.6', '0.1'),
                      borderWidth: 2,
                      tension: 0.1
                    }))
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y || 0;
                          return `${label}: ${value.toLocaleString()} TK`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Amount (TK)'
                      }
                    }
                  }
                }}
                height={300}
              />
            </div>
          )}
          
          <div className="prediction-tips mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="text-md font-semibold mb-2">Insights & Tips</h4>
            <ul className="list-disc pl-5 space-y-1">
              {Object.keys(predictionData.nextMonth)
                .filter(cat => cat !== 'Total')
                .sort((a, b) => predictionData.nextMonth[b] - predictionData.nextMonth[a])
                .slice(0, 2)
                .map(category => (
                  <li key={category}>
                    Your highest predicted expense is <strong>{category}</strong> 
                    ({predictionData.nextMonth[category]?.toLocaleString()} TK)
                  </li>
                ))
              }
              {predictionMonths > 1 && (
                <li>
                  {predictionData.multiMonth.Total[predictionMonths-1] > predictionData.multiMonth.Total[0] 
                    ? `Your expenses are predicted to increase over the next ${predictionMonths} months`
                    : `Your expenses are predicted to remain stable or decrease over the next ${predictionMonths} months`
                  }
                </li>
              )}
              <li>
                Add more monthly expense data to improve prediction accuracy
              </li>
            </ul>
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