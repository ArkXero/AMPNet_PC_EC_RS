import React, { useState } from 'react';
import { BrainCircuit, Lightbulb, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import '../styles/SolutionsPage.css';

const SolutionsPage = () => {
  const [selectedSolution, setSelectedSolution] = useState(null);
  
  // Predefined solutions
  const solutions = [
    {
      id: 1,
      title: "Predictive Load Balancing",
      description: "Implement AI-driven load balancing to predict and prevent capacity issues before they occur.",
      benefits: [
        "Reduces strain on high-traffic grid sections",
        "Prevents cascading failures during peak times",
        "Optimizes resource utilization across regions"
      ],
      implementation: "Medium difficulty (3-6 months)",
      roi: "High (15-20% reduction in outages)",
      icon: <BrainCircuit size={40} />
    },
    {
      id: 2,
      title: "Distributed Energy Storage",
      description: "Deploy battery storage systems at strategic locations to supplement grid during peak demand.",
      benefits: [
        "Provides backup power during outages",
        "Reduces transmission losses",
        "Enables better renewable energy integration"
      ],
      implementation: "High difficulty (1-2 years)",
      roi: "Medium (8-12% capacity improvement)",
      icon: <Lightbulb size={40} />
    },
    {
      id: 3,
      title: "Smart Grid Sensors Network",
      description: "Install IoT sensors across the grid to provide real-time monitoring and early warning alerts.",
      benefits: [
        "Early detection of equipment failures",
        "Real-time data collection for better decision making",
        "Automated problem reporting and diagnostics"
      ],
      implementation: "Medium difficulty (6-12 months)",
      roi: "High (30% faster issue resolution)",
      icon: <AlertTriangle size={40} />
    }
  ];
  
  return (
    <div className="solutions-page">
      <div className="solutions-header">
        <h1>AI-Powered Solutions</h1>
        <p>Intelligent recommendations to improve grid reliability and prevent outages</p>
      </div>
      
      <div className="solutions-container">
        <div className="solutions-list">
          {solutions.map(solution => (
            <div 
              key={solution.id} 
              className={`solution-card ${selectedSolution === solution.id ? 'active' : ''}`}
              onClick={() => setSelectedSolution(solution.id)}
            >
              <div className="solution-icon">
                {solution.icon}
              </div>
              <div className="solution-info">
                <h3>{solution.title}</h3>
                <p>{solution.description}</p>
              </div>
              <ArrowRight className="solution-arrow" size={20} />
            </div>
          ))}
        </div>
        
        <div className="solution-details">
          {selectedSolution ? (
            <div className="selected-solution">
              {(() => {
                const solution = solutions.find(s => s.id === selectedSolution);
                return (
                  <>
                    <h2>{solution.title}</h2>
                    <p className="solution-description">{solution.description}</p>
                    
                    <div className="solution-section">
                      <h3>Key Benefits</h3>
                      <ul className="benefits-list">
                        {solution.benefits.map((benefit, index) => (
                          <li key={index}>
                            <Check size={16} />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="solution-section">
                      <h3>Implementation</h3>
                      <p>{solution.implementation}</p>
                    </div>
                    
                    <div className="solution-section">
                      <h3>Expected ROI</h3>
                      <p>{solution.roi}</p>
                    </div>
                    
                    <div className="solution-actions">
                      <button className="primary-btn">Request Detailed Plan</button>
                      <button className="secondary-btn">Simulate Impact</button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="no-selection">
              <div className="empty-state">
                <Lightbulb size={60} />
                <h3>Select a Solution</h3>
                <p>Click on a solution from the list to view detailed information and implementation options.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionsPage;