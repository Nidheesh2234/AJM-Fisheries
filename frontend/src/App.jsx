import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import LiveMarketBoard from './components/LiveMarketBoard';
import BulkOrderingPortal from './components/BulkOrderingPortal';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import { api } from './utils/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [portalSubView, setPortalSubView] = useState('market');
  const [authOpen, setAuthOpen] = useState(false);
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [preSelectedFish, setPreSelectedFish] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  
  // Dynamic CMS state
  const [tickerItems, setTickerItems] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [partnerCards, setPartnerCards] = useState([]);
  const [valueCards, setValueCards] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});

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

  // Fetch dynamic CMS data on mount & view changes
  const loadCmsData = async () => {
    try {
      const [inv, test, part, val, setts] = await Promise.all([
        api.getInventory(),
        api.getTestimonials(),
        api.getPartnerCards(),
        api.getValueCards(),
        api.getSiteSettings()
      ]);
      setTickerItems(inv || []);
      setTestimonials(test || []);
      setPartnerCards(part || []);
      setValueCards(val || []);
      setSiteSettings(setts || {});
    } catch (err) {
      console.error('CMS load error:', err);
    }
  };

  useEffect(() => {
    loadCmsData();
  }, [currentView]);

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
    alert(`AJM Maritime Executive Desk:\n\nFor high-tonnage charter bookings or priority harbor shipments, please contact our Visakhapatnam trading office at ${siteSettings.footer_phone || '+91 891 255 1204'} or email ${siteSettings.footer_email || 'bulk@ajmfisheries.com'}.`);
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
            {/* 1. HERO SECTION */}
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
                  {siteSettings.hero_title || "Fresh From Vizag's Waters To Your Business"}
                </h1>
                <p className="hero-subtitle">
                  {siteSettings.hero_subtitle || 'Direct-from-ocean bulk seafood supply. Zero middleman markups, transparent daily pricing in Indian Rupees (₹), and temperature-controlled container logistics for luxury hotels, restaurant chains, exporters, and regional distributors nationwide.'}
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
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt="" 
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--color-border-gold)' }} 
                        />
                      ) : (
                        <span style={{ color: 'var(--color-gold)' }}>🐟</span>
                      )}
                      <span className="species">{item.species}</span>
                      <span className="price">₹{(item.current_price_inr || 0).toFixed(2)}/{item.unit || 'kg'}</span>
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
                  
                  {/* Dynamic Stat Blocks */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-number">{siteSettings.stat_1_num || '10K+'}</div>
                      <div className="stat-label">{siteSettings.stat_1_label || 'KG Daily'}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number">{siteSettings.stat_2_num || '100%'}</div>
                      <div className="stat-label">{siteSettings.stat_2_label || 'Vizag Coast'}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-number" style={{ color: 'var(--color-gold)' }}>{siteSettings.stat_3_num || '0%'}</div>
                      <div className="stat-label">{siteSettings.stat_3_label || 'Middlemen'}</div>
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

            {/* 4. CORE VALUE PROPOSITIONS (Dynamic Cards) */}
            <section className="section" id="why-us-section">
              <div className="section-header">
                <span className="section-eyebrow">Our Value</span>
                <h2 className="section-title">Industrial Sourcing & Logistics</h2>
                <p className="section-desc">
                  Providing commercial buyers the speed, scale, and temperature safety required to run high-volume catering, processing, and export divisions.
                </p>
              </div>

              <div className="props-grid">
                {valueCards.map(v => (
                  <div key={v.id} className="prop-card">
                    {v.image_url && (
                      <div className="prop-image-container">
                        <img src={v.image_url} alt={v.heading} className="prop-img" />
                      </div>
                    )}
                    <div className="prop-icon-wrap">
                      <svg className="prop-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="6" r="2"></circle><line x1="12" y1="8" x2="12" y2="22"></line><path d="M5 12H2a10 10 0 0 0 20 0h-3"></path></svg>
                      <h3>{v.heading}</h3>
                    </div>
                    <p>{v.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. CLIENTELE & PARTNER NETWORK (Dynamic Cards & Testimonials) */}
            <section className="section">
              <div className="section-header">
                <span className="section-eyebrow">Partner Network</span>
                <h2 className="section-title">Serving Major Seafood Buyers</h2>
                <p className="section-desc">
                  From coastal resort dining networks to international cargo exporters, commercial buyers trust AJM Fisheries for freight punctuality.
                </p>
              </div>

              <div className="clients-grid" style={{ marginBottom: '3.5rem' }}>
                {partnerCards.map(p => (
                  <div key={p.id} className="client-card">
                    {p.image_url && <img src={p.image_url} alt={p.title} className="client-thumb" />}
                    <div>
                      <h4>{p.title}</h4>
                      <p>{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Pull-Quote Testimonials */}
              <div className="grid-2">
                {testimonials.map(t => (
                  <div key={t.id} className="testimonial-card">
                    <div className="testimonial-quote-mark">“</div>
                    <p className="testimonial-text">{t.quote}</p>
                    <div>
                      <div className="testimonial-author">{t.author_name}</div>
                      <div className="testimonial-role">{t.role}</div>
                    </div>
                  </div>
                ))}
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

      {/* FOOTER */}
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
            <p>{siteSettings.footer_address || 'Vizag Fishing Harbour, Visakhapatnam, 530001, AP, India'}</p>
          </div>
          <div className="footer-col">
            <h4>Contact Info</h4>
            <p>📞 {siteSettings.footer_phone || '+91 891 255 1204'}</p>
            <p>✉️ {siteSettings.footer_email || 'bulk@ajmfisheries.com'}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-gold)', marginTop: '0.5rem', fontWeight: 'bold' }}>
              GSTIN: {siteSettings.footer_gstin || '37AAHCA8492K1Z9'}
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
