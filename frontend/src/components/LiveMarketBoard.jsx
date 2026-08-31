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

  return (
    <div className="card">
      <div className="market-header">
        <div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem', fontFamily: 'var(--font-serif)' }}>Live Vizag Market Registry</h2>
          <p style={{ color: 'var(--text-dark-secondary)', fontSize: '0.9rem' }}>
            Current net wholesale prices in Indian Rupees (₹) for Visakhapatnam bulk maritime distribution.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {lastUpdated && (
            <div className="update-indicator" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-dark-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-gold)', display: 'inline-block' }}></span>
              <span>Updated: {lastUpdated}</span>
            </div>
          )}
          <button className="btn btn-outline-navy" onClick={fetchInventory} style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
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
        <div style={{ overflowX: 'auto' }}>
          <table className="market-table">
            <thead>
              <tr>
                <th>Seafood Species</th>
                <th>Price per Unit (INR)</th>
                <th>Availability</th>
                <th style={{ textAlign: 'right' }}>Procurement Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((fish) => (
                <tr key={fish.id}>
                  <td>
                    <div className="fish-name">{fish.species}</div>
                  </td>
                  <td>
                    <div className="fish-price">
                      ₹{parseFloat(fish.current_price_inr || 0).toFixed(2)}{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark-secondary)' }}>/ kg</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${fish.status === 'Available' ? 'badge-available' : 'badge-outofstock'}`}>
                      {fish.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.4rem 1.1rem', fontSize: '0.8rem' }}
                      disabled={fish.status === 'Out of Season'}
                      onClick={() => handleOrderClick(fish)}
                    >
                      {fish.status === 'Out of Season' ? 'Out of Season' : 'Order Bulk Catch'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{ marginTop: '2rem', padding: '1.1rem', backgroundColor: 'var(--bg-ivory)', border: '1px solid var(--color-border-gold)', borderRadius: 'var(--border-radius-md)', fontSize: '0.85rem', color: 'var(--text-dark-secondary)' }}>
        <strong>B2B Maritime Distribution Terms:</strong> Net wholesale prices subject to dock volume availability. Cargo is shock-frozen and packed into temperature-controlled containers at Visakhapatnam Fishing Harbour.
      </div>
    </div>
  );
}
