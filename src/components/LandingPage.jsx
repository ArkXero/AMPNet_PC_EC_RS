import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, BarChart2, Zap, Shield, Award, Clock, Lightbulb } from 'lucide-react';
import '../styles/LandingPage.css';

const LandingPage = () => {
  const observerRef = useRef(null);
  
  useEffect(() => {
    const options = { root: null, rootMargin: '0px', threshold: 0.1 };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, options);

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        elements.forEach(el => observerRef.current.unobserve(el));
      }
    };
  }, []);

  const features = [
    { icon: <BarChart2 size={40} />, title: "Real-time Monitoring", description: "Monitor power grid status across cities in real-time with advanced visualization tools" },
    { icon: <Zap size={40} />, title: "Predictive Analytics", description: "AI-powered models predict potential grid failures before they occur" },
    { icon: <Shield size={40} />, title: "Vulnerability Detection", description: "Identify weak points in power infrastructure to prioritize maintenance efforts" },
    { icon: <Lightbulb size={40} />, title: "Smart Solutions", description: "Receive AI-generated recommendations for grid optimization and issue resolution" },
    { icon: <Clock size={40} />, title: "Proactive Alerts", description: "Get notified of potential overloads and critical issues before they affect citizens" },
    { icon: <Award size={40} />, title: "Sustainable Planning", description: "Develop more resilient and sustainable power infrastructure for future growth" }
  ];

  return (
    <div className="landing-page">
      {/* HERO SECTION */}
      <section className="hero">
<div className="hero-background">
  <div className="grid-lines"></div>
  <div className="circle"></div>
  {/* Lightning icon removed */}
</div>

        <div className="hero-content">
          <h1 className="animate-on-scroll">AMPNet Monitor</h1>
          <h2 className="animate-on-scroll">Bringing intelligence to urban power infrastructure</h2>
          <p className="animate-on-scroll">
            An advanced solution for city governments to monitor, predict, and optimize 
            power grid performance using artificial intelligence and real-time data analytics.
          </p>
          <div className="cta-buttons animate-on-scroll">
            <Link to="/dashboard" className="primary-btn">
              Explore Dashboard <ChevronRight size={20} />
            </Link>
            <Link to="/map" className="secondary-btn">View Power Grid Map</Link>
          </div>
        </div>

        {/* HERO IMAGE & GRID ANIMATION */}
        <div className="hero-image animate-on-scroll">
          <div className="grid-animation">
            <div className="pulse-circle"></div>
            <div className="city-grid">
              {Array(16).fill().map((_, i) => (
                <div key={i} className="grid-node" style={{ animationDelay: `${i * 0.2}s` }}></div>
              ))}
              {Array(24).fill().map((_, i) => (
                <div key={i} className="grid-line" style={{ animationDelay: `${i * 0.1}s`, transform: `rotate(${Math.floor(i/4) * 45}deg)` }}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="problem-section animate-on-scroll">
        <div className="container">
          <h2>The Challenge</h2>
          <div className="problem-content">
            <div className="problem-text">
              <p>City power grids face increasing stress from growing populations, extreme weather events, and aging infrastructure. This leads to:</p>
              <ul>
                <li>Unexpected power outages affecting critical services</li>
                <li>Costly emergency repairs and maintenance</li>
                <li>Inefficient resource allocation and energy waste</li>
                <li>Reduced resilience during natural disasters</li>
                <li>Difficulty planning for future power needs</li>
              </ul>
            </div>
            <div className="problem-image">
              <div className="outage-animation">
                <div className="city-silhouette"></div>
                <div className="lightning"></div>
                <div className="power-flicker"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="solution-section animate-on-scroll">
        <div className="container">
          <h2>Our Solution</h2>
          <div className="solution-content">
            <div className="solution-image">
              <div className="ai-prediction-animation">
                <div className="data-stream"></div>
                <div className="brain-pulse"></div>
                <div className="prediction-graph"></div>
              </div>
            </div>
            <div className="solution-text">
              <p>Power Grid AI Monitor combines real-time data from the Energy Information Administration (EIA) with advanced machine learning to:</p>
              <ul>
                <li>Continuously monitor grid performance</li>
                <li>Identify vulnerabilities before failures</li>
                <li>Predict demand spikes</li>
                <li>Generate AI-powered solutions</li>
                <li>Enable long-term sustainable planning</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section">
        <div className="container">
          <h2 className="animate-on-scroll">Key Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card animate-on-scroll" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO SECTION */}
      <section className="demo-section animate-on-scroll">
        <div className="container">
          <h2>See It In Action</h2>
          <div className="demo-content">
            <div className="demo-text">
              <p>Watch how city officials use Power Grid AI Monitor to maintain a more resilient power infrastructure.</p>
              <Link to="/dashboard" className="demo-btn">
                Try Live Demo <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-section animate-on-scroll">
        <div className="container">
          <h2>Ready to transform your city's power grid management?</h2>
          <p>Join forward-thinking city governments using Power Grid AI Monitor to create resilient, efficient infrastructure.</p>
          <Link to="/dashboard" className="primary-btn large">
            Get Started Now <ChevronRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
