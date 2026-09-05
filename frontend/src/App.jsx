import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import LiveMarketBoard from './components/LiveMarketBoard';
import BulkOrderingPortal from './components/BulkOrderingPortal';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import MarineMotion from './components/MarineMotion';
import ScrollAnimations from './components/ScrollAnimations';
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
  const [certifications, setCertifications] = useState([]);
  const [howItWorksSteps, setHowItWorksSteps] = useState([]);
  const [clientLogos, setClientLogos] = useState([]);
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
      const [inv, test, part, val, certs, steps, logos, setts] = await Promise.all([
        api.getInventory(),
        api.getTestimonials(),
        api.getPartnerCards(),
        api.getValueCards(),
        api.getCertifications(),
        api.getHowItWorksSteps(),
        api.getClientLogos(),
        api.getSiteSettings()
      ]);
      setTickerItems(inv || []);
      setTestimonials(test || []);
      setPartnerCards(part || []);
      setValueCards(val || []);
      setCertifications(certs || []);
      setHowItWorksSteps(steps || []);
      setClientLogos(logos || []);
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
    alert(`AJM Fisheries Visakhapatnam Wholesale Desk:\n\nFor urgent high-volume orders or priority harbour shipments, please contact our Visakhapatnam desk at ${siteSettings.footer_phone || '+91 891 255 1204'} or email ${siteSettings.footer_email || 'wholesale@ajmfisheries.com'}.`);
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

      {/* Scroll Animations Controller */}
      <ScrollAnimations activeView={currentView} />

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* VIEW: HOME LANDING PAGE */}
        {currentView === 'home' && (
          <div>
            {/* 1. HERO SECTION — Full Bleed Edge-to-Edge with Marine Motion */}
            <section className="hero-fullbleed">
              <div className="hero-bg-img-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85" 
                  alt="Visakhapatnam Fishing Harbour trawlers at dawn" 
                  className="hero-bg-img"
                />
              </div>
              <div className="hero-overlay"></div>
              <MarineMotion type="hero" />

              <div className="hero-content">
                <div className="hero-badge">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-gold)', display: 'inline-block' }}></span>
                  Direct From Visakhapatnam Fishing Harbour Floor
                </div>
                <h1 className="hero-title">
                  {siteSettings.hero_title || "Visakhapatnam's Most Trusted Direct Seafood Partner"}
                </h1>
                <p className="hero-subtitle">
                  {siteSettings.hero_subtitle || 'Direct-from-harbour bulk seafood supply for hotels, restaurant chains, caterers, and regional distributors across Andhra Pradesh. Zero middleman markups, transparent daily pricing in Indian Rupees (₹), and temperature-controlled local logistics.'}
                </p>
                <div className="hero-ctas">
                  <button className="btn btn-primary" onClick={handleOrderBulkClick}>
                    Browse Today's Local Catch (₹)
                  </button>
                  <button className="btn btn-secondary" onClick={handleOrderBulkClick}>
                    Commercial Procurement Desk
                  </button>
                </div>
              </div>
            </section>

            {/* 2. CERTIFICATIONS & TRUST BADGES STRIP */}
            {certifications.length > 0 && (
              <div className="container">
                <section className="certifications-section gsap-reveal">
                  <div className="certifications-container">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="certification-badge-card">
                        {cert.badge_icon_url ? (
                          <img src={cert.badge_icon_url} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                        ) : (
                          <svg className="cert-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <path d="m9 12 2 2 4-4"></path>
                          </svg>
                        )}
                        <span className="cert-label">{cert.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* 3. LIVE PRICE SPOTLIGHT TICKER */}
            <section style={{ margin: '1.5rem 0 3.5rem' }}>
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
                      {item.local_name && <span style={{ color: 'var(--text-light-secondary)', fontSize: '0.8rem' }}>({item.local_name})</span>}
                      <span className="price">₹{(item.current_price_inr || 0).toFixed(2)}/{item.unit || 'kg'}</span>
                      <span className="ticker-sep">|</span>
                    </span>
                  ))}
                  {tickerItems.length === 0 && (
                    <span className="ticker-item" style={{ color: 'var(--text-light-secondary)' }}>
                      Loading daily harbour rates... Click to view trading portal.
                    </span>
                  )}
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dark-secondary)', marginTop: '0.75rem', letterSpacing: '0.02em' }}>
                Today's local catch rates updated directly from dock landing ledgers • Click any species to order
              </p>
            </section>

            <div className="container">
              {/* 4. ABOUT & VIZAG ADVANTAGE (Asymmetric Split Screen) */}
              <section className="section gsap-reveal" id="about-section">
                <div className="split-layout">
                  <div className="split-content">
                    <span className="section-eyebrow">{siteSettings.about_section_eyebrow || 'DIRECT DOCK OPERATIONS'}</span>
                    <h3>{siteSettings.about_section_title || 'The Visakhapatnam Advantage: Freshness Measured in Hours, Not Days'}</h3>
                    <p>
                      {siteSettings.about_section_body_1 || 'Located right at the Visakhapatnam Fishing Harbour, our dockside processing facility receives catches straight off local trawlers at dawn. Every specimen is inspected, cleaned, size-graded, and iced immediately to lock in ocean freshness.'}
                    </p>
                    <p>
                      {siteSettings.about_section_body_2 || 'By eliminating multi-layer wholesale brokers, we give Vizag and Andhra Pradesh chefs guaranteed cold-chain integrity, dependable supply consistency, and honest harbour-direct pricing in INR.'}
                    </p>
                  </div>

                  <div className="split-image-wrap">
                    <img 
                      src="https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=1200&q=85" 
                      alt="Fresh glistening seafood sorting at Visakhapatnam harbour" 
                      className="split-img"
                    />
                    <div className="split-image-badge">
                      <strong>Direct Harbour Floor</strong>
                      <span>Visakhapatnam Fishing Dock Gate 4</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. FOUNDER & COMPANY STORY SECTION (NEW) */}
              <section className="section gsap-reveal" id="founder-story">
                <div className="founder-section">
                  <div className="split-layout split-layout-reverse">
                    <div className="split-image-wrap">
                      <img 
                        src={siteSettings.founder_story_image_url || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=85"} 
                        alt="AJM Fisheries Vizag Founder at Harbour Docks" 
                        className="split-img"
                      />
                      <div className="split-image-badge">
                        <strong>{siteSettings.founder_name || 'A.J. Mohan & Sons'}</strong>
                        <span>{siteSettings.founder_since_year || 'Est. 2008'} • Harbour Pioneer</span>
                      </div>
                    </div>

                    <div className="split-content">
                      <div className="founder-quote-symbol">“</div>
                      <span className="section-eyebrow">OUR HERITAGE STORY</span>
                      <h3>{siteSettings.founder_story_title || "From Vizag Harbour Docks to Andhra's Finest Tables"}</h3>
                      <p>
                        {siteSettings.founder_story_body || 'Founded over 18 years ago at the historic Visakhapatnam Fishing Harbour, AJM Fisheries began with a single trawler and a firm belief: local businesses deserve fresh, unadulterated seafood straight from the harbour floor without paying inflated middleman commissions. Today, we directly serve top culinary institutions, luxury resorts, and high-volume dining establishments across Andhra Pradesh with daily temperature-guaranteed deliveries.'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <div style={{ width: '40px', height: '2px', background: 'var(--color-gold)' }}></div>
                        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-gold)', fontSize: '1.05rem' }}>
                          Trusted local wholesale dealer in Andhra Pradesh
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* 6. FULL-BLEED STAT BLOCKS SECTION (Scroll Pinned Counter Moment) */}
            <section className="stats-fullbleed" id="stats-pin-section">
              <MarineMotion type="bubbles" />
              <div className="container">
                <div className="stats-grid-4">
                  <div className="stat-card-dark">
                    <div className="stat-number-counter" data-target={siteSettings.stat_1_num || '10,000+'}>
                      {siteSettings.stat_1_num || '10,000+'}
                    </div>
                    <div className="stat-label-dark">{siteSettings.stat_1_label || 'KG Daily Catch'}</div>
                  </div>
                  <div className="stat-card-dark">
                    <div className="stat-number-counter" data-target={siteSettings.stat_2_num || '100%'}>
                      {siteSettings.stat_2_num || '100%'}
                    </div>
                    <div className="stat-label-dark">{siteSettings.stat_2_label || 'Direct Harbour Sourced'}</div>
                  </div>
                  <div className="stat-card-dark">
                    <div className="stat-number-counter" data-target={siteSettings.stat_3_num || '0%'}>
                      {siteSettings.stat_3_num || '0%'}
                    </div>
                    <div className="stat-label-dark">{siteSettings.stat_3_label || 'Middlemen Markups'}</div>
                  </div>
                  <div className="stat-card-dark">
                    <div className="stat-number-counter" data-target={siteSettings.stat_4_num || '18+'}>
                      {siteSettings.stat_4_num || '18+'}
                    </div>
                    <div className="stat-label-dark">{siteSettings.stat_4_label || 'Years Serving Vizag'}</div>
                  </div>
                </div>
              </div>
            </section>

            <div className="container">
              {/* 7. HOW IT WORKS JOURNEY SECTION (NEW - Animated Step Scrub) */}
              <section className="how-it-works-section section" id="how-it-works-journey">
                <div className="section-header gsap-reveal">
                  <span className="section-eyebrow">{siteSettings.how_it_works_eyebrow || 'OUR DIRECT SUPPLY CHAIN'}</span>
                  <h2 className="section-title">{siteSettings.how_it_works_title || 'From Harbour Dock to Your Kitchen in 4 Seamless Steps'}</h2>
                  <p className="section-desc">
                    {siteSettings.how_it_works_subtitle || 'Experience an uninterrupted cold chain designed specifically for commercial hospitality and food service buyers.'}
                  </p>
                </div>

                <div className="journey-wrapper">
                  <div className="journey-track-line">
                    {/* Animated swimming fish indicator that moves along track on scroll */}
                    <div className="journey-swimming-fish">
                      <svg viewBox="0 0 100 50" fill="currentColor">
                        <path d="M90 25 C70 5, 30 10, 10 25 C30 40, 70 45, 90 25 Z M10 25 L0 12 L0 38 Z" />
                      </svg>
                    </div>
                  </div>

                  <div className="journey-steps-grid">
                    {howItWorksSteps.map((step) => (
                      <div key={step.id} className="journey-step-card">
                        <div className="journey-step-number">{step.step_number}</div>
                        <svg className="journey-step-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {step.icon_name === 'snowflake' ? (
                            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
                          ) : step.icon_name === 'truck' ? (
                            <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                          ) : step.icon_name === 'home' ? (
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          ) : (
                            <circle cx="12" cy="6" r="2" />
                          )}
                        </svg>
                        <h4>{step.title}</h4>
                        <p>{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* 8. CORE VALUE PROPOSITIONS (Dynamic Cards) */}
              <section className="section" id="why-us-section">
                <div className="section-header gsap-reveal">
                  <span className="section-eyebrow">THE AJM PROMISE</span>
                  <h2 className="section-title">Built for Serious B2B Seafood Buyers</h2>
                  <p className="section-desc">
                    Providing commercial buyers the speed, reliability, and temperature safety required for high-volume culinary operations.
                  </p>
                </div>

                <div className="props-grid gsap-stagger-grid">
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

              {/* 9. CLIENT LOGOS TRUST BAR (NEW) */}
              {clientLogos.length > 0 && (
                <section className="client-logos-section gsap-reveal">
                  <div className="client-logos-eyebrow">
                    Trusted by Visakhapatnam's Leading Hospitality & Catering Partners
                  </div>
                  <div className="client-logos-grid">
                    {clientLogos.map((client) => (
                      <div key={client.id} className="client-logo-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{client.client_name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 10. CLIENTELE & TESTIMONIALS */}
              <section className="section">
                <div className="section-header gsap-reveal">
                  <span className="section-eyebrow">LOCAL REPUTATION</span>
                  <h2 className="section-title">What Vizag Chefs & Caterers Say</h2>
                  <p className="section-desc">
                    Read how direct harbour supply has transformed procurement predictability for Andhra's top food service businesses.
                  </p>
                </div>

                <div className="grid-2 gsap-stagger-grid">
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
            </div>

            {/* 11. CLOSING CTA BANNER — Full Bleed Dark Navy */}
            <section className="closing-cta-fullbleed" id="contact-section">
              <MarineMotion type="closing-cta" />
              <div className="container">
                <div className="closing-cta-content gsap-reveal">
                  <h2>{siteSettings.closing_cta_headline || "Ready for Direct-from-Harbour Seafood Supply?"}</h2>
                  <p>
                    {siteSettings.closing_cta_body || "Join Visakhapatnam's leading hotels, restaurants, and caterers who rely on AJM Fisheries for daily fresh catch, transparent pricing, and guaranteed delivery."}
                  </p>
                  <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleOrderBulkClick}>
                      {siteSettings.closing_cta_button_text || "View Today's Local Rates"}
                    </button>
                    <button className="btn btn-secondary" onClick={handleEmergencyContact}>
                      Contact Wholesale Desk
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW: GATED PURCHASE PORTAL */}
        {currentView === 'portal' && combinedUser && (
          <div className="container" style={{ padding: '2rem 0 4rem' }}>
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
          <div className="container" style={{ padding: '2rem 0 4rem' }}>
            <AdminDashboard user={combinedUser} />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="site-footer" id="contact-section">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>AJM FISHERIES VISAKHAPATNAM</h3>
            <p>Visakhapatnam's premier direct harbour seafood wholesale dealer. Sourcing fresh Bay of Bengal catch daily from the harbour floor for hotels, restaurants, caterers, and distributors across Andhra Pradesh.</p>
            <div style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={handleEmergencyContact} style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
                Wholesale Desk (+91 891 255 1204)
              </button>
            </div>
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }}>Vizag HQ Home</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handlePurchasePortalClick(); }}>Daily Rates Board</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleOpenAuth(true); }}>Staff Access</a>
          </div>
          <div className="footer-col">
            <h4>Harbour Location</h4>
            <p>{siteSettings.footer_address || 'Dockside Gate 4, Vizag Fishing Harbour, Visakhapatnam, 530001, AP, India'}</p>
          </div>
          <div className="footer-col">
            <h4>Business Compliance</h4>
            <a href={`tel:${(siteSettings.footer_phone || '+91 891 255 1204').replace(/\s+/g, '')}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', gap: '0.4rem' }}>
              📞 {siteSettings.footer_phone || '+91 891 255 1204'}
            </a>
            <a href={`mailto:${siteSettings.footer_email || 'wholesale@ajmfisheries.com'}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: '44px', gap: '0.4rem' }}>
              ✉️ {siteSettings.footer_email || 'wholesale@ajmfisheries.com'}
            </a>
            <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(201, 166, 91, 0.1)', border: '1px solid var(--color-border-gold)', borderRadius: '4px', display: 'inline-block' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-gold)', fontWeight: 'bold' }}>
                GSTIN: {siteSettings.footer_gstin || '37AAHCA8492K1Z9'}
              </span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} AJM Fisheries Visakhapatnam. All rights reserved.</p>
          <p>Visakhapatnam B2B Wholesale Dealer • FSSAI & GST Compliant • Location tracking via Google Maps API.</p>
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
