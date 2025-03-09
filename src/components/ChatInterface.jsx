import React, { useState, useRef, useEffect } from 'react';
import { Send, PanelRightOpen, Lightbulb, Loader2, MessageSquare, BrainCircuit, AlertTriangle, BarChart2, Activity, Zap } from 'lucide-react';
import '../styles/ChatInterface.css';

// Related data visualizations for AI responses
const RelatedDataVisual = ({ data }) => {
  if (!data) return null;
  
  switch (data.type) {
    case 'vulnerabilities':
      return (
        <div className="related-data vulnerabilities">
          <h3>Vulnerability Assessment: {data.region} Region</h3>
          <div className="vulnerability-chart">
            <div className="vulnerability-bar critical" style={{ width: '90%' }}>
              <span>Extreme Weather Vulnerability</span>
              <span className="score">9.0/10</span>
            </div>
            <div className="vulnerability-bar critical" style={{ width: '85%' }}>
              <span>Peak Demand Overload</span>
              <span className="score">8.5/10</span>
            </div>
            <div className="vulnerability-bar high" style={{ width: '75%' }}>
              <span>Insufficient Redundancy</span>
              <span className="score">7.5/10</span>
            </div>
          </div>
          <div className="data-actions">
            <button className="data-action">View Detailed Report</button>
            <button className="data-action">Show Solutions</button>
          </div>
        </div>
      );
      
    case 'prediction':
      return (
        <div className="related-data prediction">
          <h3>Load Prediction: {data.region} Region</h3>
          <div className="prediction-chart">
            <div className="chart-container">
              {Array(24).fill().map((_, i) => {
                // Mock data generation
                const hour = i;
                const heightPercent = 40 + Math.sin((i - 12) * 0.5) * 30 + (Math.random() * 10);
                const color = heightPercent > 85 ? '#ff4d4d' : 
                              heightPercent > 70 ? '#ffaa00' : '#4caf50';
                              
                return (
                  <div className="chart-bar-container" key={i}>
                    <div 
                      className="chart-bar" 
                      style={{ 
                        height: `${heightPercent}%`,
                        backgroundColor: color
                      }}
                    ></div>
                    {i % 3 === 0 && (
                      <span className="time-label">{`${hour}:00`}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="prediction-stats">
            <div className="stat-item">
              <span className="stat-label">Peak Time:</span>
              <span className="stat-value">19:00 (7 PM)</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Peak Load:</span>
              <span className="stat-value">48,500 MW</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Risk Level:</span>
              <span className="stat-value warning">Medium</span>
            </div>
          </div>
        </div>
      );
      
    case 'alert':
      return (
        <div className="related-data alert">
          <h3>Critical Alert: {data.region} Region</h3>
          <div className="alert-details">
            <div className="alert-map">
              <div className="map-placeholder">
                <div className="alert-point pulse"></div>
                <div className="impact-radius"></div>
              </div>
            </div>
            <div className="alert-stats">
              <div className="stat-item">
                <AlertTriangle size={16} />
                <span className="stat-label">Substation:</span>
                <span className="stat-value">12B</span>
              </div>
              <div className="stat-item">
                <Zap size={16} />
                <span className="stat-label">Affected Customers:</span>
                <span className="stat-value">45,320</span>
              </div>
              <div className="stat-item">
                <Activity size={16} />
                <span className="stat-label">Temperature:</span>
                <span className="stat-value critical">+15°C above threshold</span>
              </div>
              <div className="stat-item">
                <Loader2 size={16} />
                <span className="stat-label">Response Team:</span>
                <span className="stat-value">En route (ETA 35 min)</span>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'recommendations':
      return (
        <div className="related-data recommendations">
          <h3>AI Recommendations</h3>
          <div className="recommendations-list">
            <div className="recommendation-item">
              <div className="recommendation-header">
                <div className="recommendation-icon">
                  <Lightbulb size={20} />
                </div>
                <h4>Demand Response Program</h4>
                <div className="impact-gauge">
                  <div className="impact-value" style={{ width: '80%' }}></div>
                </div>
                <span className="impact-label">8-12% impact</span>
              </div>
              <button className="view-details-btn">View Implementation Plan</button>
            </div>
            
            <div className="recommendation-item">
              <div className="recommendation-header">
                <div className="recommendation-icon">
                  <Lightbulb size={20} />
                </div>
                <h4>Smart Grid Controls</h4>
                <div className="impact-gauge">
                  <div className="impact-value" style={{ width: '60%' }}></div>
                </div>
                <span className="impact-label">5-7% impact</span>
              </div>
              <button className="view-details-btn">View Implementation Plan</button>
            </div>
            
            <div className="recommendation-item">
              <div className="recommendation-header">
                <div className="recommendation-icon">
                  <Lightbulb size={20} />
                </div>
                <h4>Battery Storage Deployment</h4>
                <div className="impact-gauge">
                  <div className="impact-value" style={{ width: '90%' }}></div>
                </div>
                <span className="impact-label">Up to 10% impact</span>
              </div>
              <button className="view-details-btn">View Implementation Plan</button>
            </div>
          </div>
        </div>
      );
      
    default:
      return null;
  }
};

// Component to render message content with markdown-like formatting
const FormattedMessage = ({ content }) => {
  // Process content to handle bold text and lists
  const processContent = (text) => {
    // Handle bold text
    const boldProcessed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle lists by splitting by newlines
    const lines = boldProcessed.split('\n');
    let inList = false;
    let processed = '';
    
    lines.forEach(line => {
      // Check for numbered list items (1. item)
      if (line.match(/^\d+\.\s+/)) {
        if (!inList) {
          processed += '<ol>';
          inList = 'ol';
        }
        const listContent = line.replace(/^\d+\.\s+/, '');
        processed += `<li>${listContent}</li>`;
      } 
      // Check for bullet list items
      else if (line.match(/^-\s+/)) {
        if (!inList) {
          processed += '<ul>';
          inList = 'ul';
        }
        const listContent = line.replace(/^-\s+/, '');
        processed += `<li>${listContent}</li>`;
      } 
      // Regular line
      else {
        if (inList) {
          processed += inList === 'ol' ? '</ol>' : '</ul>';
          inList = false;
        }
        if (line === '') {
          processed += '<br>';
        } else {
          processed += `${line}<br>`;
        }
      }
    });
    
    if (inList) {
      processed += inList === 'ol' ? '</ol>' : '</ul>';
    }
    
    return processed;
  };
  
  return (
    <div dangerouslySetInnerHTML={{ __html: processContent(content) }} />
  );
};

const ChatInterface = () => {
  // Knowledge base topics for sidebar
  const knowledgeTopics = [
    {
      title: "Grid Monitoring Basics",
      icon: <Activity size={18} />,
      items: [
        "Understanding Power Load",
        "Capacity Planning",
        "Transmission Systems",
        "Distribution Networks",
        "Substations Overview"
      ]
    },
    {
      title: "Vulnerability Assessment",
      icon: <AlertTriangle size={18} />,
      items: [
        "Risk Scoring Methodology",
        "Common Vulnerabilities",
        "Weather Impact Analysis",
        "Age-Related Risks",
        "Redundancy Planning"
      ]
    },
    {
      title: "AI Prediction Models",
      icon: <BrainCircuit size={18} />,
      items: [
        "Load Forecasting Methods",
        "Failure Prediction",
        "Weather Integration",
        "Seasonal Patterns",
        "Machine Learning Approach"
      ]
    },
    {
      title: "Optimization Strategies",
      icon: <Lightbulb size={18} />,
      items: [
        "Demand Response Programs",
        "Load Balancing Techniques",
        "Smart Grid Integration",
        "Renewable Energy Solutions",
        "Storage Utilization"
      ]
    }
  ];
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Welcome to PowerGridAI Assistant. How can I help you with your power grid monitoring needs today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setIsLoading(true);
    
    // Simulate AI thinking and then respond
    setTimeout(() => {
      const response = getAIResponse(input);
      
      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: response.text,
        relatedData: response.relatedData
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current.focus();
  };

  // Sample suggestion questions
  const suggestions = [
    "What are the current vulnerabilities in the South region?",
    "Predict power demand for the next 24 hours in the Northeast",
    "What's causing the critical alert in the Midwest?",
    "How can we reduce load during peak hours?",
    "Show me historical outage patterns for the West region",
    "What maintenance should be prioritized this week?"
  ];
  
  // Mock AI response based on user input
  const getAIResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Vulnerability query
    if (lowerInput.includes('vulnerabilities') || lowerInput.includes('weak')) {
      let region = 'South';
      if (lowerInput.includes('north')) region = 'North';
      if (lowerInput.includes('east')) region = 'East';
      if (lowerInput.includes('west')) region = 'West';
      if (lowerInput.includes('midwest')) region = 'Midwest';
      if (lowerInput.includes('northeast')) region = 'Northeast';
      
      return {
        text: `Based on our analysis, the ${region} region has several critical vulnerabilities in the power grid:\n\n**1. Extreme Weather Vulnerability (9.0/10)**: The infrastructure in this region is highly susceptible to extreme weather events, particularly during summer peak demand periods.\n\n**2. Peak Demand Overload (8.5/10)**: Current capacity is approaching maximum levels during peak hours, with only 15% headroom available.\n\n**3. Insufficient Redundancy (7.5/10)**: Several key transmission pathways lack adequate backup routes, creating single points of failure.\n\nTo address these issues, I recommend implementing load balancing strategies and exploring distributed energy resources to reduce strain during peak periods.`,
        relatedData: {
          type: 'vulnerabilities',
          region: region
        }
      };
    }
    
    // Prediction query
    else if (lowerInput.includes('predict') || lowerInput.includes('forecast') || lowerInput.includes('demand')) {
      let region = 'Northeast';
      if (lowerInput.includes('north')) region = 'North';
      if (lowerInput.includes('south')) region = 'South';
      if (lowerInput.includes('east')) region = 'East';
      if (lowerInput.includes('west')) region = 'West';
      if (lowerInput.includes('midwest')) region = 'Midwest';
      
      return {
        text: `Here's the 24-hour power demand prediction for the ${region} region:\n\n**Peak Time**: 19:00 (7 PM)\n**Peak Load**: 48,500 MW\n**Risk Level**: Medium\n\nThe forecast indicates a gradual increase throughout the day with the peak occurring in the early evening. Based on current temperature forecasts and historical patterns, we expect demand to remain within manageable levels, though still approaching 85% of available capacity during peak hours.\n\nI recommend implementing voluntary demand response measures between 18:00-20:00 to ensure stable grid operations.`,
        relatedData: {
          type: 'prediction',
          region: region
        }
      };
    }
    
    // Alert query
    else if (lowerInput.includes('alert') || lowerInput.includes('critical') || lowerInput.includes('emergency')) {
      let region = 'Midwest';
      if (lowerInput.includes('north')) region = 'North';
      if (lowerInput.includes('south')) region = 'South';
      if (lowerInput.includes('east')) region = 'East';
      if (lowerInput.includes('west')) region = 'West';
      if (lowerInput.includes('northeast')) region = 'Northeast';
      
      return {
        text: `There is currently a **CRITICAL ALERT** in the ${region} region affecting substation 12B. The issue appears to be related to transformer overheating due to the current heat wave combined with higher than expected demand.\n\n**Affected Customers**: Approximately 45,320\n**Current Temperature**: 15°C above safe operating threshold\n**Response Team Status**: En route (ETA 35 minutes)\n\nRecommended immediate actions:\n- Initiate emergency load shedding in affected sectors\n- Activate backup generators for critical infrastructure\n- Implement rolling blackouts if temperature continues to rise`,
        relatedData: {
          type: 'alert',
          region: region
        }
      };
    }
    
    // Recommendations query
    else if (lowerInput.includes('reduce') || lowerInput.includes('improve') || lowerInput.includes('solution') || lowerInput.includes('recommend')) {
      return {
        text: `Based on your current grid profile, I recommend the following strategies to improve reliability and performance:\n\n**1. Demand Response Program**\nImplement time-of-use pricing and voluntary load reduction incentives for large commercial customers during peak periods. Expected impact: 8-12% reduction in peak demand.\n\n**2. Smart Grid Control Upgrades**\nDeploy advanced distribution management systems with automated switching and real-time monitoring. Expected impact: 5-7% improvement in overall reliability metrics.\n\n**3. Battery Storage Deployment**\nInstall grid-scale battery storage systems at key substations to provide peak shaving and frequency regulation. Expected impact: Up to 10% reduction in peak load requirements.\n\nWould you like me to elaborate on any of these recommendations with implementation details?`,
        relatedData: {
          type: 'recommendations'
        }
      };
    }
    
    // Default response
    else {
      return {
        text: `I understand you're inquiring about "${userInput}". To provide the most relevant information about your power grid, could you specify what aspect you're most interested in?\n\n- Grid vulnerability assessment\n- Load forecasting and predictions\n- Alerts and critical situations\n- Optimization recommendations\n\nYou can also browse related topics in the knowledge base by opening the sidebar.`,
        relatedData: null
      };
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="chat-container">
      <div className={`knowledge-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h2>Knowledge Base</h2>
        
        {knowledgeTopics.map((topic, index) => (
          <div className="knowledge-topic" key={index}>
            <div className="topic-header">
              <span className="topic-icon">{topic.icon}</span>
              <h3>{topic.title}</h3>
            </div>
            <ul className="topic-items">
              {topic.items.map((item, i) => (
                <li key={i} onClick={() => handleSuggestionClick(`Tell me about ${item}`)}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="chat-main">
        <div className="chat-header">
          <h1><BrainCircuit /> PowerGridAI Assistant</h1>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <PanelRightOpen />
          </button>
        </div>
        
        <div className="messages-container">
          {messages.map(message => (
            <div className={`message ${message.type}`} key={message.id}>
              <div className="message-icon">
                {message.type === 'user' ? (
                  <MessageSquare size={20} />
                ) : message.type === 'ai' ? (
                  <BrainCircuit size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </div>
              <div className="message-content">
                <FormattedMessage content={message.content} />
                {message.relatedData && (
                  <RelatedDataVisual data={message.relatedData} />
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai loading">
              <div className="message-icon">
                <BrainCircuit size={20} />
              </div>
              <div className="message-content">
                <div className="loading-indicator">
                  <Loader2 className="spin" size={20} />
                  <span>Analyzing power grid data...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {showSuggestions && messages.length < 2 && (
          <div className="suggestion-chips">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        <form className="chat-input-container" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ask about your power grid..."
            value={input}
            onChange={e => setInput(e.target.value)}
            ref={inputRef}
          />
          <button type="submit" disabled={!input.trim() || isLoading}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;