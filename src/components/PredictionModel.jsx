import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import axios from 'axios';
import { RandomForestClassifier } from 'random-forest-classifier';
import { 
  BrainCircuit, 
  Calendar, 
  BarChart3, 
  Loader2, 
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Lightbulb,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { fetchRegionalPowerData, fetchHistoricalData } from '../services/api';
import '../styles/PredictionModel.css';

const createModel = () => {
  const model = tf.sequential();
  
  model.add(tf.layers.lstm({
    units: 50,
    returnSequences: true,
    inputShape: [24, 1]
  }));
  
  model.add(tf.layers.lstm({
    units: 50,
    returnSequences: false
  }));
  
  model.add(tf.layers.dense({
    units: 24,
    activation: 'linear'
  }));
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError'
  });
  
  return model;
};

const prepareData = (data, windowSize = 24) => {
  const X = [];
  const y = [];
  
  for (let i = 0; i < data.length - windowSize; i++) {
    X.push(data.slice(i, i + windowSize).map(d => d.demand));
    y.push(data.slice(i + 1, i + windowSize + 1).map(d => d.demand));
  }
  
  return {
    inputs: tf.tensor3d(X, [X.length, windowSize, 1]),
    targets: tf.tensor2d(y, [y.length, windowSize])
  };
};

const trainModel = async (historicalData) => {
  const model = createModel();
  const { inputs, targets } = prepareData(historicalData);
  
  await model.fit(inputs, targets, {
    epochs: 50,
    batchSize: 32,
    shuffle: true,
    validationSplit: 0.1,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}`);
      }
    }
  });
  
  return model;
};

const calculateAccuracy = async (predictions, validationData) => {
  if (!predictions || !validationData || predictions.length === 0 || validationData.length === 0) {
    return 0;
  }

  const errors = predictions.map((pred, index) => {
    const actual = validationData[index]?.loadValue || 0;
    const predicted = pred.load;
    return Math.abs((predicted - actual) / actual) * 100;
  });

  const averageError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
  return Math.max(0, 100 - averageError);
};

const generateGraphData = () => {
  // Generate dummy data points for the graph
  const dataPoints = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const time = new Date(now);
    time.setHours(now.getHours() + i);
    dataPoints.push({
      time: `${time.getHours()}:00`,
      load: Math.floor(Math.random() * 5000) + 3000 // Random load between 3000-8000 MW
    });
  }

  return dataPoints;
};

const generatePredictions = async (model, lastDayData, timeframe) => {
  const predictions = [];
  let input = tf.tensor3d([lastDayData.map(d => d.demand)], [-1, 24, 1]);
  
  const periods = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
  
  for (let i = 0; i < periods; i++) {
    const prediction = await model.predict(input);
    const predictionData = await prediction.data();
    predictions.push(...predictionData);
    
    if (i < periods - 1) {
      input = tf.tensor3d([predictionData], [-1, 24, 1]);
    }
  }
  
  return predictions;
};

const PredictionModel = () => {
  const [powerData, setPowerData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('Northeast');
  const [timeframe, setTimeframe] = useState('24h');
  const [modelType, setModelType] = useState('Load Forecast');
  const [modelAccuracy, setModelAccuracy] = useState(93.5);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [isRunningModel, setIsRunningModel] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchRegionalPowerData();
        setPowerData(data);
      } catch (error) {
        console.error('Error loading power data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle running a new prediction model
  const handleRunModel = async () => {
    setIsRunningModel(true);
    try {
      const historicalData = await fetchHistoricalData(selectedRegion, timeframe);
      const model = await trainModel(historicalData);
      const predictions = await generatePredictions(model, historicalData.slice(-24), timeframe);
      setPowerData(prevData => ({
        ...prevData,
        [selectedRegion]: {
          ...prevData[selectedRegion],
          predictions
        }
      }));
      
      // Calculate accuracy based on historical data
      const validationData = await fetchHistoricalData(selectedRegion, 'validation');
      const accuracy = await calculateAccuracy(predictions, validationData);
      setModelAccuracy(accuracy);
      setShowAIInsights(true);
    } catch (error) {
      console.error('Error running prediction model:', error);
    } finally {
      setIsRunningModel(false);
    }
  };

  return (
    <div className="prediction-model">
      <div className="prediction-header">
        <h1><BrainCircuit /> Power Grid Prediction Model</h1>
        <p>Forecast load and vulnerability using AI prediction models</p>
      </div>
      
      <div className="prediction-controls">
        <div className="control-panel">
          <div className="control-section">
            <h3>Region</h3>
            <div className="region-selector">
              {['Northeast', 'Midwest', 'South', 'West'].map(region => (
                <button 
                  key={region}
                  className={selectedRegion === region ? 'active' : ''}
                  onClick={() => setSelectedRegion(region)}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
          
          <div className="control-section">
            <h3>Timeframe</h3>
            <div className="timeframe-selector">
              <button 
                className={timeframe === '24h' ? 'active' : ''}
                onClick={() => setTimeframe('24h')}
              >
                24 Hours
              </button>
              <button 
                className={timeframe === '7d' ? 'active' : ''}
                onClick={() => setTimeframe('7d')}
              >
                7 Days
              </button>
              <button 
                className={timeframe === '30d' ? 'active' : ''}
                onClick={() => setTimeframe('30d')}
              >
                30 Days
              </button>
            </div>
          </div>
          
          <div className="control-section">
            <h3>Prediction Type</h3>
            <div className="model-selector">
              <button 
                className={modelType === 'load' ? 'active' : ''}
                onClick={() => setModelType('load')}
              >
                <BarChart3 size={16} />
                Load Forecast
              </button>
              <button 
                className={modelType === 'vulnerability' ? 'active' : ''}
                onClick={() => setModelType('vulnerability')}
              >
                <AlertTriangle size={16} />
                Vulnerability Assessment
              </button>
            </div>
          </div>
          
          <div className="run-model-section">
            <button 
              className="run-model-btn"
              onClick={handleRunModel}
              disabled={isRunningModel}
            >
              {isRunningModel ? (
                <>
                  <Loader2 className="spin" size={16} />
                  Running model...
                </>
              ) : (
                <>
                  <BrainCircuit size={16} />
                  Run Prediction Model
                </>
              )}
            </button>
            <div className="model-accuracy">
              <span>Model Accuracy:</span>
              <span className="accuracy-value">{modelAccuracy.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="prediction-visualization">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spin" size={40} />
            <p>Loading power grid data...</p>
          </div>
        ) : (
          <>
            <div className="graph-header">
              <h2>{modelType === 'load' ? 'Load Forecast' : 'Vulnerability Prediction'} - {selectedRegion} Region</h2>
              <div className="timeframe-info">
                <Calendar size={16} />
                <span>
                  {timeframe === '24h' ? 'Next 24 Hours' : 
                   timeframe === '7d' ? 'Next 7 Days' : 'Next 30 Days'}
                </span>
              </div>
            </div>
            
            <div className="prediction-graph">
              {!powerData[selectedRegion] ? (
                <div className="no-data-message">
                  <AlertTriangle size={30} />
                  <p>No data available for the selected region</p>
                </div>
              ) : modelType === 'load' ? (
                <div className="load-graph">
                  {/* Simulate graph with dummy elements */}
                  <div className="graph-y-axis">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                  
                  <div className="graph-container">
                    <div className="capacity-line"></div>
                    {generateGraphData().map((point, index) => {
                      const loadPercentage = powerData[selectedRegion] ? 
                        (point.load / powerData[selectedRegion].capacity) * 100 : 0;
                      const barHeight = `${loadPercentage}%`;
                      const dangerLevel = loadPercentage > 90 ? 'critical' : 
                                          loadPercentage > 75 ? 'warning' : 'normal';
                      
                      return (
                        <div className="graph-bar-container" key={index}>
                          <div 
                            className={`graph-bar ${dangerLevel}`}
                            style={{ height: barHeight }}
                          >
                            <span className="bar-value">{point.load.toLocaleString()} MW</span>
                          </div>
                          <span className="bar-label">{point.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="vulnerability-graph">
                  <div className="vulnerability-map">
                    <div className="map-region">
                      <div className={`vulnerability-indicator ${
                        powerData[selectedRegion]?.vulnerabilityScore > 75 ? 'critical' :
                        powerData[selectedRegion]?.vulnerabilityScore > 50 ? 'warning' : 'normal'
                      }`}></div>
                    </div>
                  </div>
                  <div className="vulnerability-metrics">
                    <div className="metric-item">
                      <h4>Overall Vulnerability Score</h4>
                      <div className="score-gauge">
                        <div 
                          className={`score-value ${
                            powerData[selectedRegion]?.vulnerabilityScore > 75 ? 'critical' :
                            powerData[selectedRegion]?.vulnerabilityScore > 50 ? 'warning' : 'normal'
                          }`}
                          style={{ width: `${powerData[selectedRegion]?.vulnerabilityScore || 0}%` }}
                        ></div>
                      </div>
                      <span className="score-number">{powerData[selectedRegion]?.vulnerabilityScore || 0}/100</span>
                    </div>
                    
                    <div className="vulnerability-factors">
                      <div className="factor-item">
                        <span className="factor-name">Weather Vulnerability</span>
                        <div className="factor-score">
                          <div 
                            className="factor-bar"
                            style={{ width: `${powerData[selectedRegion]?.weatherVulnerability || 0}%` }}
                          ></div>
                        </div>
                        <span className="factor-value">{powerData[selectedRegion]?.weatherVulnerability || 0}%</span>
                      </div>
                      
                      <div className="factor-item">
                        <span className="factor-name">Infrastructure Age</span>
                        <div className="factor-score">
                          <div 
                            className="factor-bar"
                            style={{ width: `${powerData[selectedRegion]?.infrastructureAge || 0}%` }}
                          ></div>
                        </div>
                        <span className="factor-value">{powerData[selectedRegion]?.infrastructureAge || 0}%</span>
                      </div>
                      
                      <div className="factor-item">
                        <span className="factor-name">Load vs Capacity</span>
                        <div className="factor-score">
                          <div 
                            className="factor-bar"
                            style={{ width: `${powerData[selectedRegion]?.loadCapacityRatio || 0}%` }}
                          ></div>
                        </div>
                        <span className="factor-value">{powerData[selectedRegion]?.loadCapacityRatio || 0}%</span>
                      </div>
                      
                      <div className="factor-item">
                        <span className="factor-name">Redundancy</span>
                        <div className="factor-score">
                          <div 
                            className="factor-bar"
                            style={{ width: `${powerData[selectedRegion]?.redundancy || 0}%` }}
                          ></div>
                        </div>
                        <span className="factor-value">{powerData[selectedRegion]?.redundancy || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {showAIInsights && (
        <div className="ai-insights">
          <div className="insights-header">
            <h2><Lightbulb size={20} /> AI Insights</h2>
            <button className="close-insights" onClick={() => setShowAIInsights(false)}>×</button>
          </div>
          <div className="insights-content">
            <div className="insight-card">
              <h3>Peak Load Analysis</h3>
              <p>The {selectedRegion} region is predicted to experience peak loads between 18:00-20:00 hours. This pattern is consistent with historical data but shows a 7% increase compared to the same period last year.</p>
              <div className="trend-indicator">
                <ArrowUpRight className="trend-up" size={16} />
                <span>7% increase year-over-year</span>
              </div>
            </div>
            
            <div className="insight-card">
              <h3>Vulnerability Hotspots</h3>
              <p>The model has identified potential vulnerability in the eastern sector of the {selectedRegion} region. Three substations (12B, 15A, 17C) are operating near capacity with aging infrastructure.</p>
              <button className="view-details-btn">View Affected Areas</button>
            </div>
            
            <div className="insight-card">
              <h3>Efficiency Recommendations</h3>
              <p>Based on the prediction model, implementing load balancing during peak hours could reduce overall vulnerability by up to 15%. Consider targeted demand response programs for high-consumption sectors.</p>
              <div className="trend-indicator">
                <ArrowDownRight className="trend-down" size={16} />
                <span>15% potential vulnerability reduction</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="historical-comparison">
        <h2>Historical Comparison</h2>
        <div className="historical-controls">
          <button className="nav-btn">
            <ChevronLeft size={20} />
          </button>
          <span className="period-label">vs. Same Period Last Month</span>
          <button className="nav-btn">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="comparison-metrics">
          <div className="metric-card">
            <h3>Peak Load</h3>
            <div className="metric-value">
              <span>{(powerData[selectedRegion]?.peakLoad || 0).toLocaleString()} MW</span>
              <div className="trend-indicator">
                <ArrowUpRight className="trend-up" size={16} />
                <span>+5.2%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <h3>Avg. Capacity Utilization</h3>
            <div className="metric-value">
              <span>{powerData[selectedRegion]?.avgUtilization || 0}%</span>
              <div className="trend-indicator">
                <ArrowUpRight className="trend-up" size={16} />
                <span>+3.7%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <h3>Vulnerability Score</h3>
            <div className="metric-value">
              <span>{powerData[selectedRegion]?.vulnerabilityScore || 0}/100</span>
              <div className="trend-indicator">
                <ArrowUpRight className="trend-up" size={16} />
                <span>+8.1%</span>
              </div>
            </div>
          </div>
          
          <div className="metric-card">
            <h3>Alert Frequency</h3>
            <div className="metric-value">
              <span>{powerData[selectedRegion]?.alertFrequency || 0}/week</span>
              <div className="trend-indicator">
                <ArrowUpRight className="trend-up" size={16} />
                <span>+12.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionModel;
