import React, { useEffect, useState, useRef } from 'react';
import { fetchRegionalPowerData, fetchCityPowerData } from '../services/api';
import '../styles/PowerGridMap.css';
import usaMapImage from '../assets/usa-map.jpg';
import { Search, AlertTriangle, Activity, Calendar, BarChart2, TrendingUp, TrendingDown, ZapOff, Power } from 'lucide-react';

const PowerGridMap = () => {
  const [powerData, setPowerData] = useState({});
  const [cityData, setCityData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityLabel, setShowCityLabel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const detailsPanelRef = useRef(null);

  // Define cities with individual styling and positioning
  const cities = [
    // Northeast
    { 
      id: "nyc", 
      name: 'New York', 
      coordinates: [80, 35], 
      region: 'Northeast',
      size: 1.3
    },
    { 
      id: "bos", 
      name: 'Boston', 
      coordinates: [82, 33], 
      region: 'Northeast',
      size: 1.2
    },
    { 
      id: "phl", 
      name: 'Philadelphia', 
      coordinates: [77, 37.5], 
      region: 'Northeast' 
    },
    { 
      id: "pit", 
      name: 'Pittsburgh', 
      coordinates: [72, 36.5], 
      region: 'Northeast' 
    },
    
    // Midwest
    { 
      id: "chi", 
      name: 'Chicago', 
      coordinates: [62, 37], 
      region: 'Midwest',
      size: 1.3
    },
    { 
      id: "det", 
      name: 'Detroit', 
      coordinates: [66, 35], 
      region: 'Midwest' 
    },
    { 
      id: "msp", 
      name: 'Minneapolis', 
      coordinates: [55, 29], 
      region: 'Midwest' 
    },
    { 
      id: "stl", 
      name: 'St. Louis', 
      coordinates: [58, 44], 
      region: 'Midwest' 
    },
    { 
      id: "cin", 
      name: 'Cincinnati', 
      coordinates: [66.7, 41.5], 
      region: 'Midwest' 
    },
    
    // South
    { 
      id: "atl", 
      name: 'Atlanta', 
      coordinates: [68, 53], 
      region: 'South',
      size: 1.2
    },
    { 
      id: "mia", 
      name: 'Miami', 
      coordinates: [75.5, 68], 
      region: 'South',
      size: 1.2
    },
    { 
      id: "hou", 
      name: 'Houston', 
      coordinates: [52, 63], 
      region: 'South',
      size: 1.3
    },
    { 
      id: "dal", 
      name: 'Dallas', 
      coordinates: [52, 57], 
      region: 'South',
      size: 1.2
    },
    { 
      id: "sat", 
      name: 'San Antonio', 
      coordinates: [48.5, 63], 
      region: 'South' 
    },
    
    // West
    { 
      id: "lax", 
      name: 'Los Angeles', 
      coordinates: [22.5, 49], 
      region: 'West',
      size: 1.3
    },
    { 
      id: "sfo", 
      name: 'San Francisco', 
      coordinates: [18.5, 39], 
      region: 'West',
      size: 1.2
    },
    { 
      id: "sea", 
      name: 'Seattle', 
      coordinates: [23.5, 21], 
      region: 'West',
      size: 1.2
    },
    { 
      id: "phx", 
      name: 'Phoenix', 
      coordinates: [30, 53], 
      region: 'West' 
    },
    { 
      id: "den", 
      name: 'Denver', 
      coordinates: [41, 42], 
      region: 'West',
      size: 1.1
    },
    { 
      id: "san", 
      name: 'San Diego', 
      coordinates: [23.5, 51.5], 
      region: 'West' 
    }
  ];

  // Region centers for labels
  const regions = {
    'Northeast': { coordinates: [80, 30], id: "northeast" },
    'Midwest': { coordinates: [57, 27], id: "midwest" },
    'South': { coordinates: [65, 50], id: "south" },
    'West': { coordinates: [30, 35], id: "west" }
  };

  // Track window resize for responsive node sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced search functionality
  const handleSearchInput = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.length < 2) {
      setFilteredCities([]);
      setShowSearchResults(false);
      return;
    }
    
    // Search by city name, region, or attributes
    const filtered = cities.filter(city => 
      city.name.toLowerCase().includes(term) || 
      city.region.toLowerCase().includes(term) ||
      (powerData[city.region]?.status?.toLowerCase().includes(term))
    );
    
    setFilteredCities(filtered);
    setShowSearchResults(true);
  };

  const selectCity = async (city) => {
    setSelectedRegion(city.region);
    setSelectedCity(city);
    setShowCityLabel(true);
    setShowSearchResults(false);
    setSearchTerm(city.name);
    
    // Fetch specific city data from API
    try {
      setLoading(true);
      const cityPowerData = await fetchCityPowerData(city.id);
      setCityData(prevData => ({
        ...prevData,
        [city.id]: cityPowerData
      }));
    } catch (error) {
      console.error(`Error fetching data for ${city.name}:`, error);
      setDataError(`Could not load data for ${city.name}`);
    } finally {
      setLoading(false);
    }
    
    // Center the map view on the selected city
    if (mapRef.current) {
      // Visual cue - flash the city node
      const cityNode = document.querySelector(`.city-marker[data-city="${city.name}"]`);
      if (cityNode) {
        cityNode.classList.add('flash-highlight');
        setTimeout(() => {
          cityNode.classList.remove('flash-highlight');
        }, 1500);
      }
    }
  };

  // Close the search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load API data
  useEffect(() => {
    // Fetch power data for all regions
    const loadPowerData = async () => {
      setLoading(true);
      setDataError(null);
      try {
        const data = await fetchRegionalPowerData();
        setPowerData(data);
        
        // If a region or city is already selected, reload its data too
        if (selectedCity) {
          const cityPowerData = await fetchCityPowerData(selectedCity.id);
          setCityData(prevData => ({
            ...prevData,
            [selectedCity.id]: cityPowerData
          }));
        }
      } catch (error) {
        console.error('Error fetching power data:', error);
        setDataError('Could not load power grid data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPowerData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadPowerData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  // When city is selected, show its label for 5 seconds
  useEffect(() => {
    if (selectedCity) {
      setShowCityLabel(true);
      const timer = setTimeout(() => {
        setShowCityLabel(false);
      }, 5000); // Show the city label for 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [selectedCity]);

  // Get CSS color based on status
  const getStatusColor = (region) => {
    if (!powerData || !powerData[region]) return "var(--healthy-color)";
    
    const status = powerData[region].status;
    switch (status) {
      case 'critical':
        return "var(--critical-color)";
      case 'warning':
        return "var(--warning-color)";
      case 'normal':
      default:
        return "var(--healthy-color)";
    }
  };
  
  // Determine color class based on status
  const getStatusClass = (region) => {
    if (!powerData || !powerData[region]) return "normal";
    return powerData[region].status || "normal";
  };
  
  // Get node size for a city (default or custom)
  const getNodeSize = (city) => {
    // Base size that factors in window size for responsive scaling
    const baseSize = (windowSize.width / 1440) * (city.size || 1);
    
    // If this is the selected city, make it larger
    if (selectedCity && city.name === selectedCity.name) {
      return baseSize * 1.8;
    }
    
    // If in the selected region, make slightly larger
    if (selectedRegion && city.region === selectedRegion) {
      return baseSize * 1.4;
    }
    
    return baseSize;
  };

  // Connect cities within the same region
  const renderConnections = () => {
    const connections = [];
    
    // Create connections between cities in the same region
    cities.forEach((cityA, indexA) => {
      cities.forEach((cityB, indexB) => {
        // Only connect cities in the same region and avoid duplicate connections
        if (indexA < indexB && cityA.region === cityB.region) {
          const [x1, y1] = cityA.coordinates;
          const [x2, y2] = cityB.coordinates;
          
          // Calculate line width based on window size
          const lineWidth = Math.max(0.5, (windowSize.width / 3000));
          
          connections.push(
            <line
              key={`${cityA.name}-${cityB.name}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke={getStatusColor(cityA.region)}
              strokeWidth={lineWidth}
              strokeOpacity="0.8"
              strokeDasharray={selectedRegion && selectedRegion !== cityA.region ? "2,2" : "none"}
              className={`power-line ${getStatusClass(cityA.region)}`}
            />
          );
        }
      });
    });
    
    return connections;
  };
  
  // New function for rendering cities - with conditional labels and dynamic sizing
  const renderCities = () => {
    return cities.map(city => {
      const nodeSize = getNodeSize(city);
      const isSelected = selectedCity && city.name === selectedCity.name;
      const isInSelectedRegion = selectedRegion === city.region;
      
      return (
        <g
          key={city.name}
          data-city={city.name}
          className={`city-marker ${selectedRegion && selectedRegion !== city.region ? "city-faded" : ""} ${isSelected ? "city-selected" : ""} ${isInSelectedRegion ? "region-city" : ""}`}
          onMouseEnter={() => setHoveredRegion(city.region)}
          onMouseLeave={() => setHoveredRegion(null)}
          onClick={() => selectCity(city)}
        >
          <circle
            cx={`${city.coordinates[0]}%`}
            cy={`${city.coordinates[1]}%`}
            r={nodeSize}
            fill={getStatusColor(city.region)}
            stroke="#fff"
            strokeWidth={isSelected ? 1 : 0.3}
            className={`power-node ${getStatusClass(city.region)}`}
          />
          {(isSelected || (hoveredRegion === city.region) || (windowSize.width > 1200 && isInSelectedRegion)) && (
            <text
              x={`${city.coordinates[0]}%`}
              y={`${city.coordinates[1] - nodeSize - 0.5}%`}
              fontSize={isSelected ? "2" : "1.5"}
              fontWeight="bold"
              textAnchor="middle"
              fill="#000"
              stroke="#fff"
              strokeWidth="0.2"
              paintOrder="stroke"
              className="city-label"
            >
              {city.name}
            </text>
          )}
        </g>
      );
    });
  };

  // Get formal status text
  const getStatusText = (status) => {
    switch(status) {
      case 'critical': return 'CRITICAL';
      case 'warning': return 'WARNING';
      case 'normal': return 'NORMAL';
      default: return 'UNKNOWN';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render the forecast chart
  const renderForecastChart = (forecasts) => {
    if (!forecasts || forecasts.length === 0) return null;
    
    // Calculate max value for scaling
    const maxValue = Math.max(...forecasts.map(f => f.value));
    
    return (
      <div className="forecast-chart">
        {forecasts.map((forecast, index) => {
          // Calculate height percentage
          const height = (forecast.value / maxValue) * 100;
          const isCritical = forecast.value > 0.8 * maxValue;
          const isWarning = forecast.value > 0.65 * maxValue && !isCritical;
          
          return (
            <div key={index} className="forecast-bar-container">
              <div 
                className={`forecast-bar ${isCritical ? 'critical' : isWarning ? 'warning' : 'normal'}`}
                style={{ height: `${height}%` }}
              />
              <div className="forecast-time">{forecast.time}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Handle clicking outside details panel on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (windowSize.width <= 768 && detailsPanelRef.current && 
          !detailsPanelRef.current.contains(event.target) &&
          !event.target.closest('.city-marker')) {
        setSelectedRegion(null);
        setSelectedCity(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [windowSize.width]);

  return (
    <div className="power-grid-map-container">
      <div className="map-controls">
        <div className="search-container" ref={searchInputRef}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by city, region, or status..."
              value={searchTerm}
              onChange={handleSearchInput}
              onFocus={() => searchTerm.length >= 2 && setShowSearchResults(true)}
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => {
                  setSearchTerm('');
                  setFilteredCities([]);
                  setShowSearchResults(false);
                }}
              >
                ×
              </button>
            )}
          </div>
          
          {showSearchResults && filteredCities.length > 0 && (
            <div className="search-results">
              {filteredCities.map(city => (
                <div 
                  key={city.name} 
                  className={`search-result-item ${getStatusClass(city.region)}`}
                  onClick={() => selectCity(city)}
                >
                  <div className="result-main">
                    <span className="result-city">{city.name}</span>
                    <span className="result-region">{city.region}</span>
                  </div>
                  <div className="result-status" style={{ backgroundColor: getStatusColor(city.region) }}></div>
                </div>
              ))}
            </div>
          )}
          
          {showSearchResults && filteredCities.length === 0 && searchTerm.length >= 2 && (
            <div className="search-results">
              <div className="no-results">No cities found matching "{searchTerm}"</div>
            </div>
          )}
        </div>
        
        <div className="legend">
          <div className="legend-item">
            <span className="legend-color healthy"></span>
            <span>Normal</span>
          </div>
          <div className="legend-item">
            <span className="legend-color warning"></span>
            <span>Warning</span>
          </div>
          <div className="legend-item">
            <span className="legend-color critical"></span>
            <span>Critical</span>
          </div>
        </div>
      </div>
      
      {loading && !selectedRegion && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading Power Grid Data...</div>
        </div>
      )}
      
      {dataError && !loading && (
        <div className="error-message">
          <AlertTriangle size={24} />
          <p>{dataError}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      <div className="map-view-container" ref={mapRef}>
        {/* USA Map background image */}
        <img src={usaMapImage} alt="USA Map" className="usa-map-background" />
        
        <svg 
          viewBox="0 0 100 80" 
          preserveAspectRatio="xMidYMid meet"
          className="usa-map-overlay"
        >
          {/* Power line connections */}
          {renderConnections()}
          
          {/* City markers */}
          {renderCities()}
          
          {/* Region labels */}
          {Object.entries(regions).map(([regionName, regionData]) => (
            <text
              key={regionName}
              x={`${regionData.coordinates[0]}%`}
              y={`${regionData.coordinates[1]}%`}
              fontSize={selectedRegion === regionName ? "3.5" : "3"}
              fontWeight="bold"
              fill={getStatusColor(regionName)}
              stroke="#fff"
              strokeWidth="0.7"
              paintOrder="stroke"
              opacity={selectedRegion === regionName ? "1" : "0.8"}
              className={`region-label ${selectedRegion === regionName ? 'region-selected' : ''}`}
              onClick={() => {
                setSelectedRegion(regionName);
                setSelectedCity(null);
              }}
            >
              {regionName}
            </text>
          ))}
        </svg>
      </div>
      
      {/* Region/City details panel */}
      {selectedRegion && powerData[selectedRegion] && (
        <div className="region-details-panel" ref={detailsPanelRef}>
          <div className="panel-header">
            <h2>{selectedCity ? selectedCity.name : selectedRegion} {selectedCity ? `(${selectedRegion})` : 'Region'}</h2>
            <button className="close-btn" onClick={() => {
              setSelectedRegion(null);
              setSelectedCity(null);
            }}>×</button>
          </div>
          
          <div className="panel-content">
            {loading && (
              <div className="panel-loading">
                <div className="loading-spinner small"></div>
                <p>Loading latest data...</p>
              </div>
            )}
            
            {!loading && (
              <>
                <div className="status-indicator">
                  <div className={`status-badge ${selectedCity && cityData[selectedCity.id] ? 
                    (cityData[selectedCity.id].status || 'normal') : 
                    powerData[selectedRegion].status}`}>
                    {selectedCity && cityData[selectedCity.id] ? 
                      getStatusText(cityData[selectedCity.id].status || 'normal') : 
                      getStatusText(powerData[selectedRegion].status)}
                  </div>
                </div>
                
                {selectedCity && cityData[selectedCity.id] && (
                  <div className="selected-city-info">
                    <div className="city-meta-grid">
                      <div className="meta-item">
                        <Activity size={16} />
                        <span className="meta-label">Status:</span>
                        <span className={`meta-value ${cityData[selectedCity.id].status}`}>
                          {getStatusText(cityData[selectedCity.id].status)}
                        </span>
                      </div>
                      <div className="meta-item">
                        <Power size={16} />
                        <span className="meta-label">Power Supply:</span>
                        <span className="meta-value">
                          {cityData[selectedCity.id].isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="meta-item">
                        <BarChart2 size={16} />
                        <span className="meta-label">Grid Reliability Index:</span>
                        <span className="meta-value">{cityData[selectedCity.id].reliabilityIndex}/100</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={16} />
                        <span className="meta-label">Last Updated:</span>
                        <span className="meta-value">{formatTimestamp(cityData[selectedCity.id].lastUpdated)}</span>
                      </div>
                    </div>
                    
                    {cityData[selectedCity.id].outages > 0 && (
                      <div className="outage-alert">
                        <ZapOff size={18} />
                        <div className="outage-details">
                          <span className="outage-title">Current Outages: </span>
                          <span className="outage-count">{cityData[selectedCity.id].outages}</span>
                          <span className="outage-impact">
                            Affecting approximately {cityData[selectedCity.id].affectedCustomers.toLocaleString()} customers
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="metrics-grid">
                  <div className="metric-card">
                    <h4>Current Load</h4>
                    <p className="metric-value">
                      <span className="number-value">
                        {selectedCity && cityData[selectedCity.id] ? 
                          (cityData[selectedCity.id].currentLoad || 0).toLocaleString() : 
                          powerData[selectedRegion].currentLoad.toLocaleString()}
                      </span>
                      <span className="unit-text">MW</span>
                    </p>
                    <p className={`metric-change ${selectedCity && cityData[selectedCity.id] ? 
                      (cityData[selectedCity.id].loadTrend > 0 ? 'increasing' : 'decreasing') : 
                      (powerData[selectedRegion].loadTrend > 0 ? 'increasing' : 'decreasing')}`}>
                      {selectedCity && cityData[selectedCity.id] ? 
                        (cityData[selectedCity.id].loadTrend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />) : 
                        (powerData[selectedRegion].loadTrend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
                      {selectedCity && cityData[selectedCity.id] ? 
                        Math.abs(cityData[selectedCity.id].loadTrend || 0).toFixed(2) : 
                        Math.abs(powerData[selectedRegion].loadTrend).toFixed(2)}% from yesterday
                    </p>
                  </div>
                  
                  <div className="metric-card">
                    <h4>Capacity</h4>
                    <p className="metric-value">
                      <span className="number-value">
                        {selectedCity && cityData[selectedCity.id] ? 
                          (cityData[selectedCity.id].capacity || 0).toLocaleString() : 
                          powerData[selectedRegion].capacity.toLocaleString()}
                      </span>
                      <span className="unit-text">MW</span>
                    </p>
                    <div className="capacity-bar">
                      <div 
                        className="capacity-fill"
                        style={{ 
                          width: `${selectedCity && cityData[selectedCity.id] ? 
                            ((cityData[selectedCity.id].currentLoad || 0) / (cityData[selectedCity.id].capacity || 1) * 100) : 
                            ((powerData[selectedRegion].currentLoad / powerData[selectedRegion].capacity) * 100)}%`,
                          backgroundColor: selectedCity ? 
                            getStatusColor(selectedCity.region) : 
                            getStatusColor(selectedRegion)
                        }}
                      ></div>
                    </div>
                    <p className="capacity-percentage">
                      {selectedCity && cityData[selectedCity.id] ? 
                        ((cityData[selectedCity.id].currentLoad || 0) / (cityData[selectedCity.id].capacity || 1) * 100).toFixed(1) : 
                        ((powerData[selectedRegion].currentLoad / powerData[selectedRegion].capacity) * 100).toFixed(1)}% of capacity
                    </p>
                  </div>
                </div>
                
                {/* Forecast section */}
                {selectedCity && cityData[selectedCity.id] && cityData[selectedCity.id].forecast && (
                  <div className="forecast-section">
                    <h3>24-Hour Load Forecast</h3>
                    {renderForecastChart(cityData[selectedCity.id].forecast)}
                    <div className="forecast-legend">
                      <div className="forecast-legend-item">
                        <span className="legend-color normal"></span>
                        <span>Normal</span>
                      </div>
                      <div className="forecast-legend-item">
                        <span className="legend-color warning"></span>
                        <span>High Load</span>
                      </div>
                      <div className="forecast-legend-item">
                        <span className="legend-color critical"></span>
                        <span>Critical</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="vulnerabilities-section">
                  <h3>Detected Vulnerabilities</h3>
                  {selectedCity && cityData[selectedCity.id] && cityData[selectedCity.id].vulnerabilities ? (
                    cityData[selectedCity.id].vulnerabilities.length > 0 ? (
                      <ul className="vulnerability-list">
                        {cityData[selectedCity.id].vulnerabilities.map((vulnerability, index) => (
                          <li key={index} className={vulnerability.severity}>
                            <span className="severity-indicator"></span>
                            <div className="vulnerability-details">
                              <h4>{vulnerability.title}</h4>
                              <p>{vulnerability.description}</p>
                              <div className="vulnerability-actions">
                                <button className="vulnerability-action-btn">View Details</button>
                                <button className="vulnerability-action-btn secondary">Dismiss</button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-vulnerabilities">No vulnerabilities detected in {selectedCity.name}</p>
                    )
                  ) : (
                    powerData[selectedRegion].vulnerabilities && powerData[selectedRegion].vulnerabilities.length > 0 ? (
                      <ul className="vulnerability-list">
                        {powerData[selectedRegion].vulnerabilities.map((vulnerability, index) => (
                          <li key={index} className={vulnerability.severity}>
                            <span className="severity-indicator"></span>
                            <div className="vulnerability-details">
                              <h4>{vulnerability.title}</h4>
                              <p>{vulnerability.description}</p>
                              <div className="vulnerability-actions">
                                <button className="vulnerability-action-btn">View Details</button>
                                <button className="vulnerability-action-btn secondary">Dismiss</button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-vulnerabilities">No vulnerabilities detected in {selectedRegion} region</p>
                    )
                  )}
                </div>
                
                {/* Recommendations section */}
                {selectedCity && cityData[selectedCity.id] && cityData[selectedCity.id].recommendations && 
                 cityData[selectedCity.id].recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h3>Smart Recommendations</h3>
                    <ul className="recommendations-list">
                      {cityData[selectedCity.id].recommendations.map((rec, index) => (
                        <li key={index} className={rec.priority}>
                          <div className="recommendation-content">
                            <h4>{rec.title}</h4>
                            <p>{rec.description}</p>
                            <div className="recommendation-impact">
                              <span className="impact-label">Impact:</span>
                              <div className="impact-rating">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <span key={i} className={i <= rec.impact ? "filled" : ""}></span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button className="action-btn">Implement</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerGridMap;
