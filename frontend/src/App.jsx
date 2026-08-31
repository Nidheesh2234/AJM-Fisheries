import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import LiveMarketBoard from './components/LiveMarketBoard';
import BulkOrderingPortal from './components/BulkOrderingPortal';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import { api } from './utils/api';

export default function App() {
  const [user, setUser] = useState(null);        // { id, email, ... } from session
  const [profile, setProfile] = useState(null);   // { full_name, role, ... } from profiles table
  const [currentView, setCurrentView] = useState('home');
  const [portalSubView, setPortalSubView] = useState('market');
  const [authOpen, setAuthOpen] = useState(false);
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [preSelectedFish, setPreSelectedFish] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  
  // Live ticker inventory
  const [tickerItems, setTickerItems] = useState([]);

  // Fetch user profile from profiles table
  const loadProfile = async (userId) => {
    try {
      const p = await api.getProfile(userId);
      setProfile(p);
      return p;
    } catch (err) {
      console.error('Failed to load profile:', err);
      return null;
    }
  };

  // Initialize auth session & listen for changes
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await api.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = api.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const p = await loadProfile(session.user.id);
        if (p?.role === 'admin') {
          setCurrentView('admin');
        } else {
          setCurrentView('portal');
          setPortalSubView('order');
        }
        setAuthOpen(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setCurrentView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load ticker inventory
  useEffect(() => {
    const loadTicker = async () => {
      try {
        const data = await api.getInventory();
        setTickerItems(data || []);
      } catch (err) {
        setTickerItems([
          { species: 'White Pomfret (Chanduva)', current_price_inr: 850 },
          { species: 'Seer Fish / Kingfish (Konema)', current_price_inr: 950 },
          { species: 'Bay Tiger Prawns (Royyalu)', current_price_inr: 650 },
          { species: 'Indian Mackerel (Kanagarthalu)', current_price_inr: 250 }
        ]);
      }
    };
    loadTicker();
  }, []);

  // Combined user object for child components
  const combinedUser = user && profile ? {
    id: user.id,
    email: user.email,
    name: profile.full_name,
    role: profile.role,
    delivery_address: profile.delivery_address,
    google_maps_link: profile.google_maps_link,
  } : null;

  const handleOpenAuth = (staffFlag = false) => {
    setIsStaffLogin(staffFlag);
    setAuthOpen(true);
  };

  const handleLoginSuccess = async (sessionUser) => {
    setUser(sessionUser);
    const p = await loadProfile(sessionUser.id);
    if (p?.role === 'admin') {
      setCurrentView('admin');
    } else {
      setCurrentView('portal');
      setPortalSubView('order');
    }
  };

  const handleOrderSelect = (fishName) => {
    setPreSelectedFish(fishName);
    setPortalSubView('order');
  };

  const handleOrderBulkClick = () => {
    if (!combinedUser) {
      handleOpenAuth(false);
    } else {
      setCurrentView('portal');
      setPortalSubView('order');
    }
  };

  const handlePurchasePortalClick = () => {
    if (!combinedUser) {
      handleOpenAuth(false);
    } else {
      setCurrentView('portal');
    }
  };

  const handleEmergencyContact = () => {
    alert("AJM Maritime Executive Desk:\n\nFor high-tonnage charter bookings or priority harbor shipments, please contact our Visakhapatnam trading office at +91 891 255 1204 or email bulk@ajmfisheries.com.");
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0B1F2E', color: '#C9A65B', fontFamily: 'var(--font-serif)' }}>
        <p style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>AJM FISHERIES | Initializing Maritime Portal...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Navigation 
        user={combinedUser} 
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'portal') {
            handlePurchasePortalClick();
          } else {
            setCurrentView(view);
          }
        }}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* VIEW: HOME LANDING PAGE */}
        {currentView === 'home' && (
          <div>
            {/* 1. HERO SECTION — Full Bleed Maritime Trawler at Dawn */}
            <section 
              className="hero-landing"
              style={{ 
                backgroundImage: `url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85')`
              }}
            >
              <div className="hero-overlay"></div>
              <div className="hero-content">
                <div className="hero-badge">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-gold)', display: 'inline-block' }}></span>
                  Today's Catch Arrived at Vizag Fishing Harbour
                </div>
                <h1 className="hero-title">
                  Fresh From Vizag's Waters To Your Business
                </h1>
                <p className="hero-subtitle">
                  Direct-from-ocean bulk seafood supply. Zero middleman markups, transparent daily pricing in Indian Rupees (₹), and temperature-controlled container logistics for luxury hotels, restaurant chains, exporters, and regional distributors nationwide.
                </p>
                <div className="hero-ctas">
                  <button className="btn btn-primary" onClick={handleOrderBulkClick}>
                    Browse Today's Bulk Catch (₹)
                  </button>
                  <button className="btn btn-secondary" onClick={handleOrderBulkClick}>
                    Partner With Us
                  </button>
                </div>
              </div>
            </section>

            {/* 2. LIVE PRICE SPOTLIGHT TICKER */}
            <section style={{ margin: '2rem 0' }}>
              <div className="ticker-wrapper" id="rates-ticker" onClick={handleOrderBulkClick}>
                <div className="ticker-track">
                  {[...tickerItems, ...tickerItems].map((item, idx) => (
                    <span key={idx} className="ticker-item">
                      <span className="species">{item.species}</span>
                      <span className="price">₹{(item.current_price_inr || 0).toFixed(2)}/kg</span>
                      <span className="ticker-sep">|</span>
                    </span>
                  ))}
                  {tickerItems.length === 0 && (
                    <span className="ticker-item" style={{ color: 'var(--text-light-secondary)' }}>
                      Loading live harbor rate feeds... Click to view trading portal.
                    </span>
                  )}
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-dark-secondary)', marginTop: '0.6rem', letterSpacing: '0.02em' }}>
                Select any catch category in the ticker to initiate bulk procurement contracts.
              </p>
            </section>

            {/* 3. ABOUT & VIZAG HERITAGE SECTION */}
            <section className="section" id="about-section">
              <div className="about-grid">
                <div className="about-text">
                  <span className="section-eyebrow">Coastal Heritage</span>
                  <h3>Direct Harbour Operations in Visakhapatnam</h3>
                  <p>
                    Established on the shores of Andhra Pradesh, AJM Fisheries operates at the heart of the historic Visakhapatnam Fishing Harbour. Sourcing seafood directly from our commercial deep-sea trawlers, we eliminate intermediate distributors.
                  </p>
                  <p>
                    Every catch is audited at the docks, cleaned, sorted by size, and packed into cold crates within hours of landing. This strict quality check guarantees fresh-state texture and peak moisture lock, satisfying demanding B2B culinary standards.
                  </p>
                  
                  {/* Stat Blocks with Gold Top Border */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-number">10K+</div>
                      <div className="stat-label">KG Daily</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">100%</div>
                      <div className="stat-label">Vizag Coast</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: 'var(--color-gold)' }}>0%</div>
                      <div className="stat-label">Middlemen</div>
                    </div>
                  </div>
                </div>

                <div className="about-image-container">
                  <img 
                    src="https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=1200&q=85" 
                    alt="Fresh glistening seafood sorting at Visakhapatnam harbour" 
                    className="about-img"
                  />
                </div>
              </div>
            </section>

            {/* 4. CORE VALUE PROPOSITIONS */}
            <section className="section" id="why-us-section">
              <div className="section-header">
                <span className="section-eyebrow">Our Value</span>
                <h2 className="section-title">Industrial Sourcing & Logistics</h2>
                <p className="section-desc">
                  Providing commercial buyers the speed, scale, and temperature safety required to run high-volume catering, processing, and export divisions.
                </p>
              </div>

              <div className="props-grid">
                <div className="prop-card">
                  <div className="prop-image-container">
                    <img 
                      src="https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&w=800&q=85" 
                      alt="Commercial deep-sea fishing trawlers at Vizag port" 
                      className="prop-img" 
                    />
                  </div>
                  <div className="prop-icon-wrap">
                    <svg className="prop-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="6" r="2"></circle><line x1="12" y1="8" x2="12" y2="22"></line><path d="M5 12H2a10 10 0 0 0 20 0h-3"></path></svg>
                    <h3>Direct Fleet Sourcing</h3>
                  </div>
                  <p>Our fleet navigates the deep waters of the Bay of Bengal, returning fresh catches directly to our private docks at Visakhapatnam harbour.</p>
                </div>

                <div className="prop-card">
                  <div className="prop-image-container">
                    <img 
                      src="https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&w=800&q=85" 
                      alt="Fresh seafood quality inspection and sorting on ice" 
                      className="prop-img" 
                    />
                  </div>
                  <div className="prop-icon-wrap">
                    <svg className="prop-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <h3>Price Transparency</h3>
                  </div>
                  <p>No hidden brokerage fees. Daily updated INR rates are published directly from dock landing ledgers onto our digital market board.</p>
                </div>

                <div className="prop-card">
                  <div className="prop-image-container">
                    <img 
                      src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=85" 
                      alt="Refrigerated cold-chain transport truck for bulk seafood delivery" 
                      className="prop-img" 
                    />
                  </div>
                  <div className="prop-icon-wrap">
                    <svg className="prop-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                    <h3>GPS Tracked Cold-Chain</h3>
                  </div>
                  <p>Transported in temperature-monitored refrigerated freighter containers. Deliveries are dispatched using Google Maps coordinate tracking.</p>
                </div>
              </div>
            </section>

            {/* 5. CLIENTELE & SOCIAL PROOF — Real Photography Thumbnails */}
            <section className="section">
              <div className="section-header">
                <span className="section-eyebrow">Partner Network</span>
                <h2 className="section-title">Serving Major Seafood Buyers</h2>
                <p className="section-desc">
                  From coastal resort dining networks to international cargo exporters, commercial buyers trust AJM Fisheries for freight punctuality.
                </p>
              </div>

              <div className="clients-grid" style={{ marginBottom: '3.5rem' }}>
                <div className="client-card">
                  <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=85" alt="Five-Star Hotels" className="client-thumb" />
                  <div>
                    <h4>Five-Star Hotels</h4>
                    <p>Premium pomfret & lobster</p>
                  </div>
                </div>
                
                <div className="client-card">
                  <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=85" alt="Restaurant Chains" className="client-thumb" />
                  <div>
                    <h4>Restaurant Chains</h4>
                    <p>Consistent wholesale fish supply</p>
                  </div>
                </div>

                <div className="client-card">
                  <img src="https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=400&q=85" alt="Export Houses" className="client-thumb" />
                  <div>
                    <h4>Export Houses</h4>
                    <p>Flash-frozen tiger prawns</p>
                  </div>
                </div>

                <div className="client-card">
                  <img src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=85" alt="Supermarket Docks" className="client-thumb" />
                  <div>
                    <h4>Supermarket Docks</h4>
                    <p>Daily packed distribution units</p>
                  </div>
                </div>
              </div>

              {/* Pull-Quote Testimonials */}
              <div className="grid-2">
                <div className="testimonial-card">
                  <div className="testimonial-quote-mark">“</div>
                  <p className="testimonial-text">
                    Transitioning our seafood procurement to AJM Fisheries Vizag cut our supply chains by 3 days. The Seer Fish arrives in perfect cold-chain condition directly at our RK Beach hotel depot.
                  </p>
                  <div>
                    <div className="testimonial-author">N. Ramakrishna</div>
                    <div className="testimonial-role">Culinary Director, Grand Andhra Resort</div>
                  </div>
                </div>

                <div className="testimonial-card">
                  <div className="testimonial-quote-mark">“</div>
                  <p className="testimonial-text">
                    Having instant daily INR rate disclosures makes commercial catering bidding highly predictable. The Google Maps delivery coordinate dropoff ensures cargo container logistics run smoothly.
                  </p>
                  <div>
                    <div className="testimonial-author">Pranav Sharma</div>
                    <div className="testimonial-role">Logistics Lead, Oceanic Processors Ltd</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. CALL TO ACTION BANNER */}
            {!combinedUser && (
              <section className="section" id="contact-section">
                <div className="cta-banner">
                  <h2>Execute a B2B Seafood Procurement Contract</h2>
                  <p>
                    Register a corporate commercial profile to access live harbor rate disclosures, calculate cargo costs in Rupees, and schedule cold-chain shipments.
                  </p>
                  <button className="btn btn-primary" onClick={() => handleOpenAuth(false)}>
                    Register Commercial Account
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* VIEW: GATED PURCHASE PORTAL */}
        {currentView === 'portal' && combinedUser && (
          <div style={{ padding: '2rem 0' }}>
            <div className="auth-tabs" style={{ marginBottom: '2.5rem' }}>
              <div 
                className={`auth-tab ${portalSubView === 'market' ? 'active' : ''}`} 
                onClick={() => setPortalSubView('market')}
              >
                Live Market Board (₹ INR)
              </div>
              <div 
                className={`auth-tab ${portalSubView === 'order' ? 'active' : ''}`} 
                onClick={() => setPortalSubView('order')}
              >
                Place Bulk Order Contract
              </div>
            </div>

            {portalSubView === 'market' && (
              <LiveMarketBoard onOrderSelect={handleOrderSelect} user={combinedUser} onOpenAuth={handleOpenAuth} />
            )}
            {portalSubView === 'order' && (
              <BulkOrderingPortal preSelectedFish={preSelectedFish} user={combinedUser} onOpenAuth={handleOpenAuth} />
            )}
          </div>
        )}

        {/* VIEW: STAFF ADMIN PANEL */}
        {currentView === 'admin' && combinedUser && combinedUser.role === 'admin' && (
          <div style={{ padding: '2rem 0' }}>
            <AdminDashboard user={combinedUser} />
          </div>
        )}
      </main>

      {/* 7. ENRICHED B2B FOOTER */}
      <footer className="site-footer" id="contact-section">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>AJM FISHERIES VIZAG</h3>
            <p>Direct maritime wholesale distributors. Harvesting fresh catch from the Bay of Bengal, packed at the Visakhapatnam docks, Andhra Pradesh, India.</p>
            <div style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={handleEmergencyContact} style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
                Emergency Executive Desk
              </button>
            </div>
          </div>
          <div className="footer-col">
            <h4>Quick Nav</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }}>Vizag HQ Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handlePurchasePortalClick(); }}>Live Rates Portal</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleOpenAuth(true); }}>Staff Access</a>
          </div>
          <div className="footer-col">
            <h4>Logistics</h4>
            <p>Vizag Fishing Harbour</p>
            <p>Visakhapatnam, 530001</p>
            <p>Andhra Pradesh, India</p>
          </div>
          <div className="footer-col">
            <h4>Contact Info</h4>
            <p>📞 +91 891 255 1204</p>
            <p>✉️ bulk@ajmfisheries.com</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-gold)', marginTop: '0.5rem', fontWeight: 'bold' }}>
              GSTIN: 37AAHCA8492K1Z9
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} AJM Fisheries Visakhapatnam. All rights reserved.</p>
          <p>Bay of Bengal Maritime Wholesale Sourcing • GST Compliant • Location tracking via Google Maps API.</p>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)}
        isStaffInitial={isStaffLogin}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
