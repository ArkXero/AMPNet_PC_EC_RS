import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Globe, 
  AlertTriangle, 
  BrainCircuit, 
  Zap, 
  TrendingUp, 
  ChevronRight,
  Activity,
  AlertCircle,
  Lightbulb  // Add this
} from 'lucide-react';
import { fetchRegionalPowerData, initializeLiveUpdates } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [powerData, setPowerData] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState({
    totalLoad: 0,
    totalCapacity: 0,
    capacityUsage: '0',
    criticalVulnerabilities: 0,
    highVulnerabilities: 0,
    mediumVulnerabilities: 0,
    totalVulnerabilities: 0,
    totalFailures: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchRegionalPowerData();
        setPowerData(data || {}); // Ensure data is at least an empty object
        calculateSystemMetrics(data || {});
      } catch (error) {
        console.error('Error loading power data:', error);
        // Set fallback data if there's an error
        setPowerData({});
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const calculateSystemMetrics = (data) => {
    // Ensure data is an object
    if (!data || typeof data !== 'object') {
      return;
    }

    let totalLoad = 0;
    let totalCapacity = 0;
    let criticalVulnerabilities = 0;
    let highVulnerabilities = 0;
    let mediumVulnerabilities = 0;
    let totalFailures = 0;

    Object.values(data).forEach(region => {
      if (region && typeof region === 'object') {
        totalLoad += region.currentLoad || 0;
        totalCapacity += region.capacity || 0;
        totalFailures += region.failures || 0;
        
        // Make sure vulnerabilities is an array before using map
        if (Array.isArray(region.vulnerabilities)) {
          region.vulnerabilities.forEach(vuln => {
            if (vuln.severity === 'critical') criticalVulnerabilities++;
            if (vuln.severity === 'high' || vuln.severity === 'warning') highVulnerabilities++;
            if (vuln.severity === 'medium') mediumVulnerabilities++;
          });
        }
      }
    });

    setSystemMetrics({
      totalLoad,
      totalCapacity,
      capacityUsage: totalCapacity > 0 ? ((totalLoad / totalCapacity) * 100).toFixed(1) : "0",
      criticalVulnerabilities,
      highVulnerabilities,
      mediumVulnerabilities,
      totalVulnerabilities: criticalVulnerabilities + highVulnerabilities + mediumVulnerabilities,
      totalFailures
    });
  };

  const generateAlerts = (powerData) => {
    if (!powerData) return [];
    
    const alerts = [];
    Object.entries(powerData).forEach(([region, data]) => {
      // Check capacity alerts
      if (data.currentLoad / data.capacity > 0.9) {
        alerts.push({
          severity: 'critical',
          title: `${region} Region Capacity Alert`,
          description: `Load at ${Math.round(data.currentLoad / data.capacity * 100)}% of capacity`,
          time: new Date().toISOString(),
          region
        });
      }
      
      // Check rapid load changes
      if (Math.abs(data.loadTrend) > 15) {
        alerts.push({
          severity: 'high',
          title: `Rapid Load Change in ${region}`,
          description: `${data.loadTrend > 0 ? 'Increase' : 'Decrease'} of ${Math.abs(data.loadTrend)}% detected`,
          time: new Date().toISOString(),
          region
        });
      }
      
      // Add vulnerability alerts
      data.vulnerabilities?.forEach(v => {
        alerts.push({
          severity: v.severity,
          title: `${v.title} - ${region}`,
          description: v.description || 'Potential system vulnerability detected',
          time: new Date().toISOString(),
          region
        });
      });
    });
    
    return alerts;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 style={{ color: 'black' }}>Power Grid Monitoring Dashboard</h1>
        <p>Real-time overview of power grid status across all monitored regions</p>
        
        <div className="tab-navigation">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            System Overview
          </button>
          <button 
            className={activeTab === 'alerts' ? 'active' : ''} 
            onClick={() => setActiveTab('alerts')}
          >
            Alerts & Vulnerabilities
          </button>
          <button 
            className={activeTab === 'predictions' ? 'active' : ''} 
            onClick={() => setActiveTab('predictions')}
          >
            Predictive Analytics
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="dashboard-content">
              <div className="metrics-overview">
                <div className="metric-card primary">
                  <div className="metric-icon">
                    <Zap size={28} />
                  </div>
                  <div className="metric-content">
                    <h3 style={{ color: 'black' }}>Total System Load</h3>
                    <p className="metric-value">{systemMetrics.totalLoad.toLocaleString()} MW</p>
                    <div className="capacity-indicator">
                      <div className="capacity-bar">
                        <div 
                          className="capacity-fill" 
                          style={{ 
                            width: `${systemMetrics.capacityUsage}%`,
                            backgroundColor: systemMetrics.capacityUsage > 90 ? 'var(--critical-color)' : 
                                            systemMetrics.capacityUsage > 75 ? 'var(--warning-color)' : 
                                            'var(--healthy-color)'
                          }}
                        ></div>
                      </div>
                      <p className="capacity-text">
                        {systemMetrics.capacityUsage}% of total capacity
                      </p>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="metric-content">
                    <h3 style={{ color: 'black' }}>Active Vulnerabilities</h3>
                    <p className="metric-value">{systemMetrics.totalVulnerabilities}</p>
                    <div className="vulnerability-breakdown">
                      <span className="critical">{systemMetrics.criticalVulnerabilities} Critical</span>
                      <span className="high">{systemMetrics.highVulnerabilities} High</span>
                      <span className="medium">{systemMetrics.mediumVulnerabilities} Medium</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <Activity size={24} />
                  </div>
                  <div className="metric-content">
                    <h3 style={{ color: 'black' }}>Recent Activities</h3>
                    <div className="updates-list">
                      {recentUpdates.slice(0, 3).map((update, index) => (
                        <div key={index} className="update-item">
                          <span className="update-time">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="update-content">
                            {update.event ? update.event.description : 
                             `Load: ${update.load.toLocaleString()} MW`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-regions">
                <h2>Regional Status</h2>
                <div className="regions-grid">
                  {Object.entries(powerData).map(([region, data]) => (
                    <div className="region-card" key={region}>
                      <div className="region-header">
                        <h3>{region}</h3>
                        <div className={`status-badge ${data.status}`}>
                          {data.status.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="region-metrics">
                        <div className="region-metric">
                          <span className="metric-label">Current Load:</span>
                          <span className="metric-value">{data.currentLoad.toLocaleString()} MW</span>
                        </div>
                        <div className="region-metric">
                          <span className="metric-label">Capacity:</span>
                          <span className="metric-value">{data.capacity.toLocaleString()} MW</span>
                        </div>
                        <div className="region-metric">
                          <span className="metric-label">Stability:</span>
                          <span className="metric-value">{data.stabilityScore}/100</span>
                        </div>
                      </div>
                      
                      <div className="capacity-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${(data.currentLoad / data.capacity) * 100}%`,
                              backgroundColor: (data.currentLoad / data.capacity) > 0.9 ? '#ff4d4d' : 
                                              (data.currentLoad / data.capacity) > 0.75 ? '#ffaa00' : '#4caf50'
                            }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {((data.currentLoad / data.capacity) * 100).toFixed(1)}% of capacity
                        </span>
                      </div>
                      
                      {data.vulnerabilities.length > 0 && (
                        <div className="region-vulnerabilities">
                          <h4>Top Vulnerability:</h4>
                          <div className={`vulnerability-item ${data.vulnerabilities[0].severity}`}>
                            <span className="severity-indicator"></span>
                            <span className="vulnerability-title">{data.vulnerabilities[0].title}</span>
                          </div>
                        </div>
                      )}
                      
                      <Link to="/map" className="region-action">
                        View Details <ChevronRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="dashboard-sections">
                <div className="dashboard-section live-updates">
                  <div className="section-header">
                    <h2>Recent Updates</h2>
                    <Link to="/live-updates" className="view-all">
                      View All <ChevronRight size={16} />
                    </Link>
                  </div>
                  
                  <div className="updates-list">
                    {recentUpdates.length === 0 ? (
                      <p className="no-data">Waiting for updates...</p>
                    ) : (
                      recentUpdates.map((update, index) => (
                        <div className="update-item" key={index}>
                          <div className="update-time">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="update-content">
                            <span className="update-region">{update.region}:</span>
                            {update.event ? (
                              <span className={`update-event ${update.event.severity}`}>
                                {update.event.description}
                              </span>
                            ) : (
                              <span className="update-load">
                                Load: {update.load.toLocaleString()} MW
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="dashboard-section quick-actions">
                  <div className="section-header">
                    <h2>Quick Access</h2>
                  </div>
                  
                  <div className="quick-links">
                    <Link to="/map" className="quick-link">
                      <Globe size={24} />
                      <span>Power Grid Map</span>
                    </Link>
                    <Link to="/alerts" className="quick-link">
                      <AlertCircle size={24} />
                      <span>Alert System</span>
                    </Link>
                    <Link to="/predictions" className="quick-link">
                      <BrainCircuit size={24} />
                      <span>AI Predictions</span>
                    </Link>
                    <Link to="/chat" className="quick-link">
                      <Lightbulb size={24} />
                      <span>Smart Suggestions</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'alerts' && (
            <div className="dashboard-content">
              <div className="alerts-overview">
                <h2>System Vulnerabilities & Alerts</h2>
                {loading ? (
                  <div className="loading-state">Loading alerts...</div>
                ) : (
                  <>
                    {generateAlerts(powerData).length > 0 ? (
                      <>
                        <div className="alerts-summary">
                          <div className="alert-metric critical">
                            <h3>Critical</h3>
                            <p className="metric-value">
                              {generateAlerts(powerData).filter(a => a.severity === 'critical').length}
                            </p>
                          </div>
                          <div className="alert-metric high">
                            <h3>High</h3>
                            <p className="metric-value">
                              {generateAlerts(powerData).filter(a => a.severity === 'high').length}
                            </p>
                          </div>
                          <div className="alert-metric medium">
                            <h3>Medium</h3>
                            <p className="metric-value">
                              {generateAlerts(powerData).filter(a => a.severity === 'medium').length}
                            </p>
                          </div>
                        </div>
                        
                        <div className="active-alerts-list">
                          {generateAlerts(powerData).map((alert, index) => (
                            <div key={index} className={`alert-item ${alert.severity}`}>
                              <div className="alert-header">
                                <AlertTriangle size={20} />
                                <h3>{alert.title}</h3>
                                <span className="alert-time">
                                  {new Date(alert.time).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="alert-description">{alert.description}</p>
                              <div className="alert-actions">
                                <button className="action-btn primary">Take Action</button>
                                <button className="action-btn secondary">View Details</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="healthy-system">
                        <div className="healthy-icon">✓</div>
                        <h3>System Healthy</h3>
                        <p>No active alerts or vulnerabilities detected</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'predictions' && (
            <div className="dashboard-content predictions-tab">
              <div className="prediction-overview">
                <h2>AI-Powered Load Predictions</h2>
                <p className="section-description">
                  Our advanced machine learning models predict power demand across all regions for the next 24 hours, 
                  helping you proactively manage resources and prevent potential failures.
                </p>
                
                <div className="prediction-cards">
                  {Object.entries(powerData).map(([region, data]) => (
                    <div className="prediction-card" key={region}>
                      <div className="prediction-header">
                        <h3>{region} Region</h3>
                      </div>
                      
                      <div className="prediction-chart">
                        <div className="chart-container">
                          <div className="chart-y-axis">
                            <span>{Math.ceil(data.capacity * 0.9)} MW</span>
                            <span>{Math.ceil(data.capacity * 0.7)} MW</span>
                            <span>{Math.ceil(data.capacity * 0.5)} MW</span>
                          </div>
                          <div className="chart-bars">
                            {data.prediction.map((point, index) => (
                              <div className="chart-bar-container" key={index}>
                                <div 
                                  className="chart-bar" 
                                  style={{ 
                                    height: `${(point.load / data.capacity) * 100}%`,
                                    backgroundColor: (point.load / data.capacity) > 0.9 ? '#ff4d4d' : 
                                                    (point.load / data.capacity) > 0.75 ? '#ffaa00' : '#4caf50'
                                  }}
                                  title={`${point.time}: ${point.load.toLocaleString()} MW`}
                                ></div>
                                {index % 3 === 0 && (
                                  <span className="time-label">{point.time}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="prediction-metrics">
                          <div className="prediction-metric">
                            <span className="metric-label">Max Predicted:</span>
                            <span className="metric-value">
                              {Math.max(...data.prediction.map(p => p.load)).toLocaleString()} MW
                            </span>
                          </div>
                          <div className="prediction-metric">
                            <span className="metric-label">Peak Time:</span>
                            <span className="metric-value">
                              {data.prediction.reduce((max, point) => 
                                point.load > max.load ? point : max
                              ).time}
                            </span>
                          </div>
                          <div className="prediction-metric">
                            <span className="metric-label">Risk Level:</span>
                            <span className={`metric-value ${
                              Math.max(...data.prediction.map(p => p.load)) / data.capacity > 0.9 ? 'critical' :
                              Math.max(...data.prediction.map(p => p.load)) / data.capacity > 0.75 ? 'warning' : 'normal'
                            }`}>
                              {Math.max(...data.prediction.map(p => p.load)) / data.capacity > 0.9 ? 'High' :
                               Math.max(...data.prediction.map(p => p.load)) / data.capacity > 0.75 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="ai-recommendations">
                  <h2>AI-Generated Recommendations</h2>
                  <div className="recommendations-list">
                    <div className="recommendation-item">
                      <div className="recommendation-icon">
                        <BrainCircuit size={28} />
                      </div>
                      <div className="recommendation-content">
                        <h3>South Region Load Reduction</h3>
                        <p>Implement demand response program for large industrial consumers between 2PM-6PM to reduce peak load by 15%.</p>
                        <div className="impact-gauge">
                          <span>Potential Impact:</span>
                          <div className="impact-rating">
                            <span className="filled"></span>
                            <span className="filled"></span>
                            <span className="filled"></span>
                            <span className="filled"></span>
                            <span className="filled"></span>
                          </div>
                        </div>
                        <button className="implement-btn">Implement Recommendation</button>
                      </div>
                    </div>
                    
                    <div className="recommendation-item">
                      <div className="recommendation-icon">
                        <BrainCircuit size={28} />
                      </div>
                      <div className="recommendation-content">
                        <h3>Midwest Maintenance Prioritization</h3>
                        <p>Schedule emergency maintenance for the Northwestern substation transformers within 48 hours to prevent potential failures.</p>
                        <div className="impact-gauge">
                          <span>Potential Impact:</span>
                          <div className="impact-rating">
                            <span className="filled"></span>
                            <span className="filled"></span>
                            <span className="filled"></span>
                            <span className="filled"></span>
                            <span></span>
                          </div>
                        </div>
                        <button className="implement-btn">Implement Recommendation</button>
                      </div>
                    </div>
                    
                    <div className="recommendation-item">
                      <div className="recommendation-icon">
                        <BrainCircuit size={28} />
                      </div>
                      <div className="recommendation-content">
                        <h3>West Region Renewable Integration</h3>
                        <p>Adjust battery storage charging schedule to optimize for predicted solar output dips between 4PM-6PM tomorrow.</p>
                        <div className="impact-gauge">
                          <span>Potential Impact:</span>
                          <div className="impact-rating">
                            <span className="filled"></span>
                            <span className="filled"></span>
                            <span className="filled"></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                        <button className="implement-btn">Implement Recommendation</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;