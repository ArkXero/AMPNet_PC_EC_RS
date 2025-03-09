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

  // Regions configuration
  const regions = {
    'Northeast': { id: "northeast", coordinates: [80, 30] },
    'Midwest': { id: "midwest", coordinates: [57, 27] },
    'South': { id: "south", coordinates: [65, 50] },
    'West': { id: "west", coordinates: [30, 35] }
  };

  // Track window resize
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

  // API Data Loading
  useEffect(() => {
    const loadPowerData = async () => {
      try {
        setLoading(true);
        const data = await fetchRegionalPowerData();
        setPowerData(data);
        setDataError(null);
      } catch (error) {
        console.error('Error fetching power data:', error);
        setDataError('Failed to load power grid data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPowerData();
  }, []);

  // Handle search
  const handleSearchInput = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.length < 2) {
      setFilteredCities([]);
      setShowSearchResults(false);
      return;
    }
    
    const filtered = cities.filter(city => 
      city.name.toLowerCase().includes(term) || 
      city.region.toLowerCase().includes(term)
    );
    
    setFilteredCities(filtered);
    setShowSearchResults(true);
  };

  // Select city
  const selectCity = async (city) => {
    setSelectedCity(city);
    setSelectedRegion(city.region);
    setShowSearchResults(false);
    
    try {
      if (!cityData[city.id]) {
        const data = await fetchCityPowerData(city.id);
        setCityData(prev => ({ ...prev, [city.id]: data }));
      }
    } catch (error) {
      console.error("Error fetching city data:", error);
    }
  };

  // Get status color
  const getStatusColor = (region) => {
    if (!powerData[region]) return "var(--healthy-color)";
    
    const status = powerData[region].status;
    switch (status) {
      case 'critical':
        return "var(--critical-color)";
      case 'warning':
        return "var(--warning-color)";
      default:
        return "var(--healthy-color)";
    }
  };

  // Get status class
  const getStatusClass = (region) => {
    if (!powerData[region]) return "normal";
    return powerData[region].status || "normal";
  };

  // Get node size for cities
  const getNodeSize = (city) => {
    return city.size || 1;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'critical': return 'CRITICAL';
      case 'warning': return 'WARNING';
      case 'normal': return 'NORMAL';
      default: return 'UNKNOWN';
    }
  };

  // Render connections between cities
  const renderConnections = () => {
    const connections = [];
    
    cities.forEach((cityA, indexA) => {
      cities.forEach((cityB, indexB) => {
        if (indexA < indexB && cityA.region === cityB.region) {
          connections.push(
            <line
              key={`${cityA.id}-${cityB.id}`}
              x1={cityA.coordinates[0]}
              y1={cityA.coordinates[1]}
              x2={cityB.coordinates[0]}
              y2={cityB.coordinates[1]}
              stroke={getStatusColor(cityA.region)}
              strokeWidth="0.2"
              className={`power-line ${getStatusClass(cityA.region)}`}
              strokeOpacity={selectedRegion ? (selectedRegion === cityA.region ? 0.8 : 0.2) : 0.5}
            />
          );
        }
      });
    });
    
    return connections;
  };

  // Render forecast chart
  const renderForecastChart = (forecasts) => {
    if (!forecasts || forecasts.length === 0) return null;
    
    const maxValue = Math.max(...forecasts.map(f => f.value || f.load || 0));
    
    return (
      <div className="forecast-chart">
        {forecasts.map((forecast, index) => {
          const value = forecast.value || forecast.load || 0;
          const height = (value / maxValue) * 100;
          const isCritical = value > 0.8 * maxValue;
          const isWarning = value > 0.65 * maxValue && !isCritical;
          
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

  // Adding the crucial return statement that was missing
  return (
    <div className="power-grid-map-container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading power grid data...</p>
        </div>
      )}
      
      {dataError && (
        <div className="error-message">
          <AlertTriangle size={32} />
          <p>{dataError}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      <div className="map-controls">
        <div className="search-container" ref={searchInputRef}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search for a city..."
              value={searchTerm}
              onChange={handleSearchInput}
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => {
                  setSearchTerm('');
                  setFilteredCities([]);
                  setShowSearchResults(false);
                }}
              >×</button>
            )}
          </div>
          
          {showSearchResults && (
            <div className="search-results">
              {filteredCities.length > 0 ? (
                filteredCities.map(city => (
                  <div
                    key={city.id}
                    className="search-result-item"
                    onClick={() => selectCity(city)}
                  >
                    <div className="result-main">
                      <div className="result-city">{city.name}</div>
                      <div className="result-region">{city.region}</div>
                    </div>
                    <div
                      className="result-status"
                      style={{ backgroundColor: getStatusColor(city.region) }}
                    ></div>
                  </div>
                ))
              ) : (
                <div className="no-results">No cities found</div>
              )}
            </div>
          )}
        </div>
        
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color healthy"></div>
            <span>Normal</span>
          </div>
          <div className="legend-item">
            <div className="legend-color warning"></div>
            <span>Warning</span>
          </div>
          <div className="legend-item">
            <div className="legend-color critical"></div>
            <span>Critical</span>
          </div>
        </div>
      </div>
      
      <div className="map-view-container" ref={mapRef}>
        <img src={usaMapImage} alt="USA Map" className="usa-map-background" />
        
        <svg className="usa-map-overlay" viewBox="0 0 100 70">
          {renderConnections()}
          
          {cities.map(city => {
            const nodeSize = getNodeSize(city);
            const isSelected = selectedCity && selectedCity.id === city.id;
            const isInSelectedRegion = selectedRegion === city.region;
            
            return (
              <g
                key={city.id}
                className={`city-marker ${isSelected ? 'city-selected' : ''} ${selectedRegion && !isInSelectedRegion ? 'city-faded' : ''}`}
                transform={`translate(${city.coordinates[0]}, ${city.coordinates[1]})`}
                onClick={() => selectCity(city)}
              >
                <circle
                  className={`power-node ${getStatusClass(city.region)}`}
                  r={nodeSize}
                  fill={getStatusColor(city.region)}
                  stroke="#ffffff"
                  strokeWidth="0.3"
                />
                
                {(isSelected || city.size > 1.1 || (isInSelectedRegion && city.size > 1)) && (
                  <text
                    className="city-label"
                    y={nodeSize + 1}
                    textAnchor="middle"
                    fontSize="1.2"
                    fill="#333"
                    stroke="#fff"
                    strokeWidth="0.3"
                    paintOrder="stroke"
                  >
                    {city.name}
                  </text>
                )}
              </g>
            );
          })}
          
          {Object.entries(regions).map(([name, data]) => (
            <text
              key={data.id}
              className={`region-label ${selectedRegion === name ? 'region-selected' : ''}`}
              x={data.coordinates[0]}
              y={data.coordinates[1]}
              textAnchor="middle"
              fontSize={selectedRegion === name ? "2.5" : "2"}
              opacity={selectedRegion && selectedRegion !== name ? 0.5 : 0.8}
              fontWeight={selectedRegion === name ? "bold" : "normal"}
              fill={getStatusColor(name)}
              stroke="#fff"
              strokeWidth="0.4"
              paintOrder="stroke"
              onClick={() => setSelectedRegion(selectedRegion === name ? null : name)}
            >
              {name}
            </text>
          ))}
        </svg>
      </div>
      
      {(selectedRegion || selectedCity) && (
        <div className="region-details-panel">
          <div className="panel-header">
            <h2>{selectedCity ? selectedCity.name : selectedRegion}</h2>
            <button 
              className="close-btn" 
              onClick={() => {
                setSelectedRegion(null);
                setSelectedCity(null);
              }}
            >
              &times;
            </button>
          </div>
          
          <div className="panel-content">
            {/* Panel content here */}
            {selectedCity && cityData[selectedCity.id] ? (
              <div className="city-details">
                <div className="status-indicator">
                  <div className={`status-badge ${cityData[selectedCity.id].status}`}>
                    {getStatusText(cityData[selectedCity.id].status)}
                  </div>
                </div>
                
                {/* City metrics would go here */}
              </div>
            ) : (
              selectedRegion && powerData[selectedRegion] && (
                <div className="region-details">
                  <div className="status-indicator">
                    <div className={`status-badge ${powerData[selectedRegion].status}`}>
                      {getStatusText(powerData[selectedRegion].status)}
                    </div>
                  </div>
                  
                  {/* Region metrics would go here */}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PowerGridMap;

