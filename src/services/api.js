/* eslint-disable no-unused-vars */
import axios from 'axios';

const API_KEY = 'gZPheMkoLiUAO2P3Lq7E9d6JXMO62MTxD52qTaMe';
const EIA_BASE_URL = 'https://api.eia.gov/v2';
/* eslint-enable no-unused-vars */

// Map our regions to EIA respondent codes
const REGION_MAPPING = {
  'Northeast': 'ISONE', // ISO New England
  'West': 'CISO',      // California ISO
  'Midwest': 'MISO',   // Midcontinent ISO
  'South': 'ERCO'      // ERCOT
};


let cachedData = {};
const CACHE_DURATION = 60000; // 1 minute cache
let lastFetchTime = 0;

let cachedCityData = {};



function getCityName(cityId) {
  const cityNames = {
    "nyc": "New York",
    "bos": "Boston",
    "phl": "Philadelphia",
    "pit": "Pittsburgh",
    "chi": "Chicago",
    "det": "Detroit",
    "msp": "Minneapolis",
    "stl": "St. Louis",
    "cin": "Cincinnati",
    "atl": "Atlanta",
    "mia": "Miami",
    "hou": "Houston",
    "dal": "Dallas",
    "sat": "San Antonio",
    "lax": "Los Angeles",
    "sfo": "San Francisco",
    "sea": "Seattle",
    "phx": "Phoenix",
    "den": "Denver",
    "san": "San Diego"
  };
  
  return cityNames[cityId] || "Unknown City";
}

// Main fetch function for regional data
export const fetchRegionalPowerData = async () => {
  try {
    const now = Date.now();
    const startDate = new Date(now - 24*60*60*1000); // Last 24 hours
    
    // Try to fetch real data from EIA API
    const responses = await Promise.all(Object.entries(REGION_MAPPING).map(([region, isoCode]) => 
      axios.get(`${EIA_BASE_URL}/electricity/rto/region-data`, {
        params: {
          api_key: API_KEY,
          data: ['demand', 'net-generation', 'interchange'],
          facets: { respondent: [isoCode] },
          frequency: 'hourly',
          start: startDate.toISOString(),
          end: new Date(now).toISOString(),
          sort: [{ column: 'period', direction: 'desc' }]
        }
      })
    ));

    // Process real API data
    const realData = {};
    responses.forEach((response, index) => {
      const [region] = Object.entries(REGION_MAPPING)[index];
      const data = response.data?.response?.data?.[0] || null;
      
      if (data) {
        const utilization = data.demand / (data['net-generation'] * 1.2);
        realData[region] = {
          currentLoad: data.demand,
          capacity: data['net-generation'] * 1.2,
          status: utilization > 0.9 ? 'critical' : utilization > 0.75 ? 'warning' : 'normal',
          alertFrequency: Math.ceil(utilization * 5), // Correlates with utilization
          capacityUtilization: Math.round(utilization * 100 * 100) / 100, // Two decimal places
          peakLoad: data.demand * (1 + (Math.random() * 0.1)), // Add slight variation
          vulnerabilityScore: Math.round((utilization * 100) * (0.8 + Math.random() * 0.4))
        };
      }
    });

    return realData;
    
  } catch (error) {
    console.warn('API fetch failed, using correlated random data:', error);
    
    // Generate correlated random data if API fails
    const timestamp = Date.now();
    const baseloadFactor = 0.7 + (Math.sin(timestamp / 86400000) * 0.3); // Daily cycle
    
    return Object.keys(REGION_MAPPING).reduce((acc, region) => {
      const regionHash = region.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const baseLoad = 3500 + (Math.sin(regionHash) * 1500) * baseloadFactor;
      const capacity = baseLoad * (1.4 + (Math.cos(regionHash) * 0.2));
      const utilization = baseLoad / capacity;
      
      acc[region] = {
        currentLoad: Math.round(baseLoad * 100) / 100,
        capacity: Math.round(capacity * 100) / 100,
        status: utilization > 0.9 ? 'critical' : utilization > 0.75 ? 'warning' : 'normal',
        alertFrequency: Math.ceil(utilization * 5),
        capacityUtilization: Math.round(utilization * 100 * 100) / 100,
        peakLoad: Math.round(baseLoad * (1.1 + Math.sin(timestamp/3600000) * 0.1) * 100) / 100,
        vulnerabilityScore: Math.round((utilization * 100) * (0.8 + Math.random() * 0.4))
      };
      return acc;
    }, {});
  }
};

// Mock city data fetch - simplified for development
export const fetchCityPowerDataMock = async (cityId) => {
  try {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock data for the selected city
    return {
      id: cityId,
      status: ['normal', 'warning', 'critical'][Math.floor(Math.random() * 3)],
      isOnline: true,
      currentLoad: Math.floor(Math.random() * 5000) + 3000,
      capacity: 10000,
      loadTrend: (Math.random() * 10) - 5,
      reliabilityIndex: Math.floor(Math.random() * 30) + 70,
      outages: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
      affectedCustomers: Math.floor(Math.random() * 10000),
      lastUpdated: new Date().toISOString(),
      forecast: Array.from({length: 24}, (_, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        value: Math.floor(Math.random() * 8000) + 2000
      })),
      vulnerabilities: Math.random() > 0.5 ? [{
        title: 'Example Vulnerability',
        description: 'This is a mock vulnerability for testing',
        severity: ['warning', 'critical'][Math.floor(Math.random() * 2)]
      }] : [],
      recommendations: Math.random() > 0.5 ? [{
        title: 'Example Recommendation',
        description: 'This is a mock recommendation for testing',
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        impact: Math.floor(Math.random() * 5) + 1
      }] : []
    };
  } catch (error) {
    console.error('Error generating mock city data:', error);
    return generateFallbackCityData(cityId);
  }
};

export const fetchHistoricalData = async (region, timeframe) => {
  try {
    // For development, use fallback data instead of actual API calls
    return generateFallbackHistoricalData(timeframe);
    
    /*
    // Real API code - commented out for development
    const isoCode = REGION_MAPPING[region];
    const endDate = new Date();
    const startDate = new Date(endDate);
    
    // Adjust timeframe
    switch(timeframe) {
      case '24h': startDate.setHours(endDate.getHours() - 24); break;
      case '7d': startDate.setDate(endDate.getDate() - 7); break;
      case '30d': startDate.setDate(endDate.getDate() - 30); break;
      default: startDate.setHours(endDate.getHours() - 24);
    }
    
    const response = await axios.get(`${EIA_BASE_URL}/electricity/rto/region-data`, {
      params: {
        api_key: API_KEY,
        data: ['demand', 'net-generation'],
        facets: { respondent: [isoCode] },
        frequency: 'hourly',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        sort: [{ column: 'period', direction: 'asc' }]
      }
    });
    
    if (response.data?.response?.data?.length > 0) {
      return response.data.response.data.map(d => ({
        timestamp: new Date(d.period).getTime(),
        loadValue: d.demand,
        forecastValue: d.demand * (0.95 + Math.random() * 0.1) // Simulate forecast
      }));
    } else {
      throw new Error("No historical data available");
    }
    */
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return generateFallbackHistoricalData(timeframe);
  }
};

// Generate consistent prediction data based on historical patterns
function generatePredictionData(data, capacity) {
  const predictions = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const hour = (now.getHours() + i) % 24;
    let baseLoad;
    
    // Use real data pattern if available
    if (data && data.length > 12) {
      const historicalIndex = data.findIndex(d => {
        const dataDate = new Date(d.period);
        return dataDate.getHours() === hour;
      });
      
      baseLoad = historicalIndex >= 0 ? data[historicalIndex].demand : null;
    }
    
    // If we couldn't find historical data for this hour, create realistic pattern
    if (!baseLoad) {
      // Morning ramp up
      if (hour >= 5 && hour <= 9) {
        baseLoad = capacity * (0.5 + (hour - 5) * 0.07);
      }
      // Midday plateau
      else if (hour >= 10 && hour <= 17) {
        baseLoad = capacity * 0.75;
      }
      // Evening peak
      else if (hour >= 18 && hour <= 21) {
        baseLoad = capacity * (0.8 - (hour - 18) * 0.03);
      }
      // Night trough
      else {
        baseLoad = capacity * 0.45;
      }
      
      // Add some noise
      baseLoad = baseLoad * (0.95 + Math.random() * 0.1);
    }
    
    predictions.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      load: Math.round(baseLoad)
    });
  }
  
  return predictions;
}

function determineStatus(data) {
  if (!data || typeof data.demand !== 'number') return 'normal';
  
  let utilization;
  if (typeof data['net-generation'] === 'number' && data['net-generation'] > 0) {
    utilization = data.demand / (data['net-generation'] * 1.2);
  } else {
    // Make up a realistic utilization if net-generation is missing
    utilization = 0.6 + Math.random() * 0.3;
  }
  
  if (utilization > 0.9) return 'critical';
  if (utilization > 0.75) return 'warning';
  return 'normal';
}

function calculateTrend(data) {
  try {
    if (!Array.isArray(data) || data.length < 2) return 0;
    const validData = data.filter(d => typeof d.demand === 'number');
    if (validData.length < 2) return 0;
    
    const first = validData[validData.length - 1].demand;
    const last = validData[0].demand;
    return Number(((last - first) / first * 100).toFixed(1));
  } catch (e) {
    return 0;
  }
}

function generateVulnerabilities(data) {
  try {
    const vulnerabilities = [];
    if (!Array.isArray(data) || data.length === 0) return vulnerabilities;
    
    const latestData = data[0];
    if (!latestData || typeof latestData.demand !== 'number') {
      return vulnerabilities;
    }
    
    let utilization;
    if (typeof latestData['net-generation'] === 'number' && latestData['net-generation'] > 0) {
      utilization = latestData.demand / (latestData['net-generation'] * 1.2);
    } else {
      utilization = 0.6 + Math.random() * 0.3;
    }
    
    if (utilization > 0.9) {
      vulnerabilities.push({
        title: 'High Capacity Utilization',
        severity: 'critical',
        description: 'System operating near maximum capacity'
      });
    }
    
    const trend = calculateTrend(data);
    if (Math.abs(trend) > 15) {
      vulnerabilities.push({
        title: `Rapid ${trend > 0 ? 'Increase' : 'Decrease'} in Demand`,
        severity: 'warning',
        description: `Demand changed by ${Math.abs(trend)}% recently`
      });
    }
    
    return vulnerabilities;
  } catch (e) {
    return [];
  }
}

function getFallbackData(region) {
  // Generate consistent fallback data based on region
  const regionSeed = region.charCodeAt(0) + region.length;
  const baseLoad = 4000 + (regionSeed * 100);
  const capacity = baseLoad * 1.5;
  const currentLoad = baseLoad + Math.floor(Math.random() * 500);
  
  // Determine status based on actual utilization, not randomly
  const utilization = currentLoad / capacity;
  let status;
  if (utilization > 0.9) status = 'critical';
  else if (utilization > 0.75) status = 'warning';
  else status = 'normal';
  
  return {
    currentLoad,
    capacity,
    status, // Now based on the actual load/capacity ratio
    loadTrend: (Math.random() - 0.5) * 10,
    stabilityScore: 70 + (regionSeed % 20),
    failures: Math.floor(Math.random() * 3),
    vulnerabilities: generateFallbackVulnerabilities(utilization),
    prediction: Array(24).fill(0).map((_, i) => {
      const hour = i;
      let load;
      
      if (hour >= 5 && hour <= 9) {
        load = baseLoad * (0.5 + (hour - 5) * 0.07);
      } else if (hour >= 10 && hour <= 17) {
        load = baseLoad * 0.75;
      } else if (hour >= 18 && hour <= 21) {
        load = baseLoad * (0.8 - (hour - 18) * 0.03);
      } else {
        load = baseLoad * 0.45;
      }
      
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        load: Math.round(load * (0.95 + Math.random() * 0.1))
      };
    })
  };
}

// New function for consistent fallback vulnerabilities
function generateFallbackVulnerabilities(utilization) {
  const vulnerabilities = [];
  
  if (utilization > 0.9) {
    vulnerabilities.push({
      title: 'High Capacity Utilization',
      severity: 'critical',
      description: 'System operating near maximum capacity'
    });
  }
  
  if (utilization > 0.8 && Math.random() > 0.5) {
    vulnerabilities.push({
      title: 'Increasing Load Trend',
      severity: 'warning',
      description: 'Demand growing rapidly in this region'
    });
  }
  
  return vulnerabilities;
}

function getFallbackDataForAllRegions() {
  const regions = {};
  Object.keys(REGION_MAPPING).forEach(region => {
    regions[region] = getFallbackData(region);
  });
  return regions;
}

function generateFallbackHistoricalData(timeframe) {
  const endDate = new Date();
  const startDate = new Date(endDate);
  let dataPoints;
  
  switch(timeframe) {
    case '24h':
      startDate.setHours(endDate.getHours() - 24);
      dataPoints = 24;
      break;
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      dataPoints = 7 * 24;
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      dataPoints = 30 * 24;
      break;
    default:
      startDate.setHours(endDate.getHours() - 24);
      dataPoints = 24;
  }
  
  const baseLoad = 5000;
  const result = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(startDate);
    timestamp.setHours(startDate.getHours() + i);
    
    const hour = timestamp.getHours();
    let load;
    
    // Create realistic load pattern
    if (hour >= 5 && hour <= 9) {
      load = baseLoad * (0.5 + (hour - 5) * 0.07);
    } else if (hour >= 10 && hour <= 17) {
      load = baseLoad * 0.75;
    } else if (hour >= 18 && hour <= 21) {
      load = baseLoad * (0.8 - (hour - 18) * 0.03);
    } else {
      load = baseLoad * 0.45;
    }
    
    // Add some daily variation
    const dayMultiplier = 0.9 + ((timestamp.getDay() % 7) * 0.03);
    load *= dayMultiplier;
    
    // Add random noise
    load *= (0.95 + Math.random() * 0.1);
    
    result.push({
      timestamp: timestamp.getTime(),
      loadValue: Math.round(load),
      forecastValue: Math.round(load * (0.95 + Math.random() * 0.1))
    });
  }
  
  return result;
}

/**
 * Fetch city-specific power grid data
 * @param {string} cityId - The city identifier
 */
export const fetchCityPowerData = async (cityId) => {
  try {
    // Reduced delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Minimal data structure
    return {
      id: cityId,
      status: 'normal',
      currentLoad: 1000 + Math.floor(Math.random() * 500),
      capacity: 2500,
      score: 80 + Math.floor(Math.random() * 15),
      vulnerabilityScore: 20 + Math.floor(Math.random() * 20),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching city data:', error);
    return null;
  }
};

/**
 * Process regional data into city-specific data
 */
function processCityData(regionData, cityId, region) {
  try {
    // Create a unique but consistent modifier for this city
    const cityHash = cityId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const cityModifier = 0.7 + ((cityHash % 60) / 100); // 0.7 to 1.3 range
    
    // Base city data on regional data, but with city-specific adjustments
    const cityLoad = Math.round(regionData.currentLoad * cityModifier / 10); // Cities are ~1/10th of region
    const cityCapacity = Math.round(cityLoad * 1.2 + (cityHash % 500)); // Add some variance
    
    // Calculate load percentage for status determination
    const loadPercentage = (cityLoad / cityCapacity) * 100;
    let cityStatus = 'normal';
    if (loadPercentage > 85) cityStatus = 'critical';
    else if (loadPercentage > 70) cityStatus = 'warning';
    else if (regionData.status === 'critical') cityStatus = 'warning'; // Regional effect
    
    // Calculate reliability index (higher is better)
    const reliabilityBase = cityHash % 15; // 0-14 range
    const reliabilityIndex = Math.min(98, Math.max(65, 85 - reliabilityBase + (regionData.status === 'normal' ? 5 : 0)));
    
    // Determine if there are outages
    const hasOutages = cityStatus === 'critical' || 
                      (cityStatus === 'warning' && Math.random() > 0.7) ||
                      reliabilityIndex < 75;
    
    const outageCount = hasOutages ? Math.floor(Math.random() * 3) + 1 : 0;
    const affectedCustomers = outageCount > 0 ? outageCount * (1000 + (cityHash % 2000)) : 0;
    
    // Calculate city vulnerabilities
    const vulnerabilities = [];
    if (regionData.vulnerabilities && regionData.vulnerabilities.length > 0) {
      // Copy relevant regional vulnerabilities
      regionData.vulnerabilities.forEach(v => {
        if (v.severity === 'critical' || (v.severity === 'warning' && Math.random() > 0.5)) {
          vulnerabilities.push({
            ...v,
            description: v.description.replace(region, `${getCityName(cityId)} area`)
          });
        }
      });
    }
    
    // Add city-specific vulnerabilities
    if (loadPercentage > 80) {
      vulnerabilities.push({
        title: 'High Demand Alert',
        description: `Current power demand in ${getCityName(cityId)} is approaching capacity limits.`,
        severity: 'critical'
      });
    }
    
    if (reliabilityIndex < 75) {
      vulnerabilities.push({
        title: 'Grid Stability Risk',
        description: `The ${getCityName(cityId)} distribution network shows signs of instability.`,
        severity: 'warning'
      });
    }
    
    if (outageCount > 0) {
      vulnerabilities.push({
        title: 'Active Outages',
        description: `${outageCount} outage(s) affecting ${affectedCustomers.toLocaleString()} customers in ${getCityName(cityId)}.`,
        severity: 'critical'
      });
    }
    
    // Generate smart recommendations
    const recommendations = generateRecommendations(cityStatus, outageCount, reliabilityIndex, cityId);
    
    // Generate forecast based on regional prediction but adjusted for the city
    const forecast = regionData.prediction ? 
      regionData.prediction.map(hour => ({
        time: hour.time,
        value: Math.round(hour.load * cityModifier / 10 * (0.95 + Math.random() * 0.1))
      })) : 
      generateCityForecastData(cityLoad);
    
    return {
      status: cityStatus,
      currentLoad: cityLoad,
      capacity: cityCapacity,
      loadTrend: regionData.loadTrend + ((cityHash % 10) - 5), // +/- 5% from region trend
      reliabilityIndex,
      isOnline: true,
      outages: outageCount,
      affectedCustomers,
      lastUpdated: new Date().toISOString(),
      vulnerabilities,
      recommendations,
      forecast
    };
  } catch (error) {
    console.error(`Error in processCityData for ${cityId}:`, error);
    return generateFallbackCityData(cityId);
  }
};

/**
 * Generate recommendations based on city conditions
 */
function generateRecommendations(status, outages, reliabilityIndex, cityId) {
  const recommendations = [];
  
  // Recommendations for high load
  if (status === 'critical') {
    recommendations.push({
      title: 'Implement Load Shedding',
      description: `Temporarily reduce non-essential power consumption in ${getCityName(cityId)} to prevent grid failure.`,
      priority: 'high',
      impact: 5
    });
    
    recommendations.push({
      title: 'Activate Emergency Generation',
      description: 'Bring backup generation assets online to supplement capacity.',
      priority: 'high',
      impact: 4
    });
  }
  
  // Recommendations for warning conditions
  if (status === 'warning') {
    recommendations.push({
      title: 'Issue Public Conservation Alert',
      description: `Request voluntary reduction in energy usage in ${getCityName(cityId)} during peak hours.`,
      priority: 'medium',
      impact: 3
    });
  }
  
  // Recommendations for outages
  if (outages > 0) {
    recommendations.push({
      title: 'Deploy Repair Crews',
      description: `Prioritize restoration efforts for ${outages} active outages in ${getCityName(cityId)}.`,
      priority: 'high',
      impact: 5
    });
  }
  
  // General improvement recommendations
  if (reliabilityIndex < 80) {
    recommendations.push({
      title: 'Schedule Infrastructure Assessment',
      description: `Conduct comprehensive evaluation of vulnerable grid components in ${getCityName(cityId)}.`,
      priority: 'medium',
      impact: 4
    });
  }
  
  // Always add at least one general recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Optimize Maintenance Schedule',
      description: 'Analyze historical performance data to optimize preventative maintenance timing.',
      priority: 'low',
      impact: 2
    });
  }
  
  return recommendations;
}

/**
 * Generate forecast data for a city
 */
function generateCityForecastData(baseLoad) {
  const forecasts = [];
  const now = new Date();
  
  // Generate 24 hourly forecasts
  for (let i = 0; i < 24; i++) {
    const hour = (now.getHours() + i) % 24;
    
    // Create a demand curve with peak in afternoon/evening
    let demand;
    
    // Morning ramp up
    if (hour >= 5 && hour <= 9) {
      demand = baseLoad * (0.5 + (hour - 5) * 0.07);
    }
    // Midday plateau
    else if (hour >= 10 && hour <= 17) {
      demand = baseLoad * 0.75;
    }
    // Evening peak
    else if (hour >= 18 && hour <= 21) {
      demand = baseLoad * (0.8 - (hour - 18) * 0.03);
    }
    // Night trough
    else {
      demand = baseLoad * 0.45;
    }
    
    // Add some random variation
    const randomFactor = 0.95 + (Math.random() * 0.1); // 0.95 to 1.05
    
    forecasts.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      value: Math.round(demand * randomFactor)
    });
  }
  
  return forecasts;
}

/**
 * Generate fallback data for a city when API fails
 */
function generateFallbackCityData(cityId) {
  try {
    // Get a consistent seed value for this city
    const cityHash = cityId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    // Generate base load between 300-1500 MW
    const baseLoad = 300 + (cityHash % 1200);
    const capacity = Math.round(baseLoad * (1.2 + (cityHash % 40) / 100)); // 20-60% headroom
    
    // Calculate load percentage
    const loadPercentage = (baseLoad / capacity) * 100;
    let status = 'normal';
    if (loadPercentage > 85) status = 'critical';
    else if (loadPercentage > 70) status = 'warning';
    
    // Calculate reliability index (higher is better)
    const reliabilityIndex = Math.min(98, Math.max(65, 85 - (cityHash % 20)));
    
    // Determine if there are outages
    const hasOutages = status === 'critical' || 
                      (status === 'warning' && Math.random() > 0.7) ||
                      reliabilityIndex < 75;
    
    const outageCount = hasOutages ? Math.floor(Math.random() * 3) + 1 : 0;
    const affectedCustomers = outageCount > 0 ? outageCount * (1000 + (cityHash % 2000)) : 0;
    
    // Generate vulnerabilities
    const vulnerabilities = [];
    if (status === 'critical') {
      vulnerabilities.push({
        title: 'Peak Demand Alert',
        description: `Current power demand in ${getCityName(cityId)} is approaching capacity limits.`,
        severity: 'critical'
      });
    }
    
    if (reliabilityIndex < 75) {
      vulnerabilities.push({
        title: 'Grid Reliability Issue',
        description: `System reliability in ${getCityName(cityId)} is below acceptable thresholds.`,
        severity: 'warning'
      });
    }
    
    if (outageCount > 0) {
      vulnerabilities.push({
        title: 'Active Outages',
        description: `${outageCount} outage(s) affecting ${affectedCustomers.toLocaleString()} customers in ${getCityName(cityId)}.`,
        severity: 'critical'
      });
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(status, outageCount, reliabilityIndex, cityId);
    
    // Generate forecast
    const forecast = generateCityForecastData(baseLoad);
    
    return {
      status,
      currentLoad: baseLoad,
      capacity,
      loadTrend: Math.round((Math.random() * 10) - 5), // -5 to +5%
      reliabilityIndex,
      isOnline: true,
      outages: outageCount,
      affectedCustomers,
      lastUpdated: new Date().toISOString(),
      vulnerabilities,
      recommendations,
      forecast
    };
  } catch (error) {
    console.error(`Error in generateFallbackCityData:`, error);
    // Return absolute minimum data structure that won't crash the UI
    return {
      status: 'normal',
      currentLoad: 1000,
      capacity: 2000,
      loadTrend: 0,
      reliabilityIndex: 80,
      isOnline: true,
      outages: 0,
      affectedCustomers: 0,
      lastUpdated: new Date().toISOString(),
      vulnerabilities: [],
      recommendations: [{
        title: 'Maintenance',
        description: 'Regular system maintenance',
        priority: 'low',
        impact: 1
      }],
      forecast: Array(24).fill(0).map((_, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        value: 500 + Math.floor(Math.random() * 500)
      }))
    };
  }
}