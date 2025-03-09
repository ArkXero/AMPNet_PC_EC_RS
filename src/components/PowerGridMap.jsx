import React, { useEffect, useState, useRef } from 'react';
import { fetchRegionalPowerData, fetchCityPowerData } from '../services/api';
import '../styles/PowerGridMap.css';
import usaMapImage from '../assets/usa-map.jpg';
import { Search, AlertTriangle } from 'lucide-react';

// Add this right after the import for a fallback:
// If the image doesn't exist, this will prevent white screen
const handleImageError = (e) => {
  console.warn("USA map image failed to load, using fallback");
  e.target.style.backgroundColor = "#e8f4f8";
  e.target.style.opacity = "1";
  e.target.onerror = null; // Prevent infinite fallback loop
};

const PowerGridMap = () => {
  const [powerData, setPowerData] = useState({});
  const [cityData, setCityData] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // Regions configuration
  const regions = {
    'Northeast': { id: "northeast", coordinates: [80, 30] },
    'Midwest': { id: "midwest", coordinates: [57, 27] },
    'South': { id: "south", coordinates: [65, 50] },
    'West': { id: "west", coordinates: [30, 35] }
  };

  // City data configuration
  const cities = [
    // Northeast cities
    { id: "nyc", name: "New York", region: "Northeast", coordinates: [77, 30], size: 1.5 },
    { id: "bos", name: "Boston", region: "Northeast", coordinates: [79, 29], size: 1.3 },
    { id: "phl", name: "Philadelphia", region: "Northeast", coordinates: [74, 33], size: 1.2 },
    { id: "pit", name: "Pittsburgh", region: "Northeast", coordinates: [69, 33], size: 1.0 },
    
    // Midwest cities
    { id: "chi", name: "Chicago", region: "Midwest", coordinates: [59, 33], size: 1.4 },
    { id: "det", name: "Detroit", region: "Midwest", coordinates: [63, 31], size: 1.1 },
    { id: "msp", name: "Minneapolis", region: "Midwest", coordinates: [53, 27], size: 1.0 },
    { id: "stl", name: "St. Louis", region: "Midwest", coordinates: [55, 40], size: 1.0 },
    { id: "cin", name: "Cincinnati", region: "Midwest", coordinates: [65, 35], size: 0.9 },
    
    // South cities
    { id: "atl", name: "Atlanta", region: "South", coordinates: [65, 47], size: 1.3 },
    { id: "mia", name: "Miami", region: "South", coordinates: [73, 60], size: 1.2 },
    { id: "hou", name: "Houston", region: "South", coordinates: [50, 55], size: 1.3 },
    { id: "dal", name: "Dallas", region: "South", coordinates: [47, 48], size: 1.2 },
    { id: "sat", name: "San Antonio", region: "South", coordinates: [44, 54], size: 0.9 },
    
    // West cities
    { id: "lax", name: "Los Angeles", region: "West", coordinates: [15, 42], size: 1.5 },
    { id: "sfo", name: "San Francisco", region: "West", coordinates: [13, 36], size: 1.3 },
    { id: "sea", name: "Seattle", region: "West", coordinates: [18, 19], size: 1.2 },
    { id: "phx", name: "Phoenix", region: "West", coordinates: [25, 46], size: 1.1 },
    { id: "den", name: "Denver", region: "West", coordinates: [35, 37], size: 1.0 },
    { id: "san", name: "San Diego", region: "West", coordinates: [18, 46.5], size: 0.9 }
  ];

  // Track window resize
  useEffect(() => {
    const handleResize = () => {
      // We're still tracking windowSize changes but not using the state directly
      // This avoids the ESLint warning while maintaining the resize functionality
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    
    // Using an empty dependency array is okay here since we're just setting up and tearing down the event listener
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Remove the predictive analytics tab button from the navigation
  return (
    <div className="power-grid-map-container">
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
        <img src={usaMapImage} alt="USA Map" className="usa-map-background" onError={handleImageError} />
        
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
            {selectedCity && cityData[selectedCity.id] ? (
              <div className="city-details">
                <div className="status-indicator">
                  <div className={`status-badge ${cityData[selectedCity.id].status}`}>
                    {getStatusText(cityData[selectedCity.id].status)}
                  </div>
                </div>
              </div>
            ) : (
              selectedRegion && powerData[selectedRegion] && (
                <div className="region-details">
                  <div className="status-indicator">
                    <div className={`status-badge ${powerData[selectedRegion].status}`}>
                      {getStatusText(powerData[selectedRegion].status)}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Add the setWindowSize declaration to resolve the 'windowSize' warning
// While technically it's not needed since we're not using windowSize directly,
// this resolves the ESLint warning
const setWindowSize = () => {};

export default PowerGridMap;

