import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function LiveMarketBoard({ onOrderSelect, user, onOpenAuth }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory();
      setInventory(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setError('');
    } catch (err) {
      setError('Unable to fetch live market rates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    const interval = setInterval(fetchInventory, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderClick = (fish) => {
    if (!user) {
      onOpenAuth(false);
    } else {
      onOrderSelect(fish.species);
    }
  };

  // Gold Fish Silhouette Placeholder SVG
  const FishPlaceholder = () => (
    <div style={{
      width: '44px',
      height: '44px',
      borderRadius: '8px',
      background: 'rgba(201, 166, 91, 0.1)',
      border: '1px solid var(--color-border-gold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-gold)',
      flexShrink: 0
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 12c0-3.5-3-6-7-6-5 0-9 4-9 6s4 6 9 6c4 0 7-2.5 7-6z"></path>
        <path d="M18 12l4-4v8l-4-4z"></path>
        <circle cx="7" cy="11" r="1" fill="currentColor"></circle>
      </svg>
    </div>
  );

  return (
    <div className="card">
      <div className="market-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem', fontFamily: 'var(--font-serif)' }}>Live Vizag Market Registry</h2>
          <p style={{ color: 'var(--text-dark-secondary)', fontSize: '0.88rem' }}>
            Current net wholesale prices in Indian Rupees (₹) for Visakhapatnam bulk maritime distribution.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {lastUpdated && (
            <div className="update-indicator" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-dark-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-gold)', display: 'inline-block' }}></span>
              <span>Updated: {lastUpdated}</span>
            </div>
          )}
          <button className="btn btn-outline-navy" onClick={fetchInventory} style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', minHeight: '38px' }}>
            Refresh Rates
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && inventory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark-secondary)' }}>
          <p>Retrieving harbor rate disclosures...</p>
        </div>
      ) : inventory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark-secondary)' }}>
          <p>No catch varieties currently registered in inventory.</p>
        </div>
      ) : (
        <div className="responsive-table-wrap">
          <table className="market-table">
            <thead>
              <tr>
                <th>Seafood Species</th>
                <th>Category</th>
                <th>Price per Unit (INR)</th>
                <th>Availability</th>
                <th style={{ textAlign: 'right' }}>Procurement Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((fish) => (
                <tr key={fish.id}>
                  <td data-label="Species">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {fish.image_url ? (
                        <img 
                          src={fish.image_url} 
                          alt={fish.species} 
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid var(--color-border-gold)',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <FishPlaceholder />
                      )}
                      <div>
                        <div className="fish-name">{fish.species}</div>
                        {fish.local_name && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)', fontWeight: '500' }}>
                            {fish.local_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td data-label="Category">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dark-secondary)' }}>
                      {fish.category || 'Fish'}
                    </span>
                  </td>
                  <td data-label="Price (INR)">
                    <div className="fish-price">
                      ₹{parseFloat(fish.current_price_inr || 0).toFixed(2)}{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark-secondary)' }}>/ {fish.unit || 'kg'}</span>
                    </div>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${fish.status === 'Available' ? 'badge-available' : 'badge-outofstock'}`}>
                      {fish.status}
                    </span>
                  </td>
                  <td data-label="Action" style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', minHeight: '36px' }}
                      disabled={fish.status === 'Out of Season'}
                      onClick={() => handleOrderClick(fish)}
                    >
                      {fish.status === 'Out of Season' ? 'Out of Season' : 'Order Catch'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-ivory)', border: '1px solid var(--color-border-gold)', borderRadius: 'var(--border-radius-md)', fontSize: '0.82rem', color: 'var(--text-dark-secondary)' }}>
        <strong>B2B Wholesale Supply Terms:</strong> Net wholesale prices subject to dock landing volume availability. Orders are flake-iced and packed in temperature-controlled crates directly at Visakhapatnam Fishing Harbour.
      </div>
    </div>
  );
}
