import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function BulkOrderingPortal({ preSelectedFish, user, onOpenAuth }) {
  const [inventory, setInventory] = useState([]);
  const [fishType, setFishType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      setOrdersLoading(true);
      const ordersData = await api.getMyOrders(user.id);
      setMyOrders(ordersData || []);
    } catch (err) {
      console.error('Could not fetch order logs:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const fetchAvailableFish = async () => {
        try {
          const data = await api.getInventory();
          const available = data.filter(item => item.status === 'Available');
          setInventory(available);
          
          if (preSelectedFish) {
            setFishType(preSelectedFish);
          } else if (available.length > 0) {
            setFishType(available[0].species);
          }
          setError('');
        } catch (err) {
          setError('Could not retrieve available species list.');
        } finally {
          setInventoryLoading(false);
        }
      };

      fetchAvailableFish();
      fetchMyOrders();
      
      if (user.delivery_address) setDeliveryLocation(user.delivery_address);
      if (user.google_maps_link) setGoogleMapsLink(user.google_maps_link);
    }
  }, [user, preSelectedFish]);

  const getSelectedFishPrice = () => {
    const selected = inventory.find(item => item.species === fishType);
    return selected ? (selected.current_price_inr || 0) : 0;
  };

  const calculateTotal = () => {
    const pricePerKg = getSelectedFishPrice();
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return 0;
    const multiplier = quantityUnit === 'tons' ? 1000 : 1;
    return pricePerKg * qty * multiplier;
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fishType) {
      setError('Please select a seafood variety.');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid positive bulk quantity.');
      return;
    }
    if (!deliveryLocation.trim()) {
      setError('Please specify the exact delivery destination.');
      return;
    }
    if (!googleMapsLink || !googleMapsLink.trim().startsWith('http')) {
      setError('Please paste a valid Google Maps link for shipment tracking.');
      return;
    }

    setLoading(true);

    try {
      const estimatedTotal = calculateTotal();
      const response = await api.createOrder({
        customer_id: user.id,
        customer_name: user.name || user.email,
        fish_type: fishType,
        quantity: parseFloat(quantity),
        quantity_unit: quantityUnit,
        total_price_inr: estimatedTotal,
        delivery_location: deliveryLocation,
        google_maps_link: googleMapsLink
      });

      setSuccess(`Your B2B procurement contract has been submitted! Order Reference: ${response.order_ref}`);
      setQuantity('');
      fetchMyOrders();
    } catch (err) {
      setError(err.message || 'Failed to submit order. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <svg style={{ width: '48px', height: '48px', color: 'var(--color-gold)', marginBottom: '1rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="6" r="2"></circle>
          <line x1="12" y1="8" x2="12" y2="22"></line>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
        </svg>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>Wholesale Purchasing Portal</h2>
        <p style={{ color: 'var(--text-dark-secondary)', maxWidth: '460px', margin: '0 auto 2rem auto', fontSize: '0.95rem' }}>
          Access to the AJM Visakhapatnam maritime procurement ledger is reserved for commercial partners.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => onOpenAuth(false)}>
            Sign In to Account
          </button>
          <button className="btn btn-secondary" onClick={() => onOpenAuth(false)}>
            Register Company
          </button>
        </div>
      </div>
    );
  }

  const selectedPrice = getSelectedFishPrice();
  const estimatedTotal = calculateTotal();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Ordering Form Card */}
      <div className="card">
        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem', fontFamily: 'var(--font-serif)' }}>Bulk Ordering Portal</h2>
        <p style={{ color: 'var(--text-dark-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Execute wholesale procurement contracts directly into our Vizag cargo logistics ledger.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {inventoryLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark-secondary)' }}>
            <p>Analyzing current cargo holds and harbor metrics...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-coral)' }}>
            <p>All seafood species are currently out of stock or out of season.</p>
          </div>
        ) : (
          <form onSubmit={handleOrderSubmit} className="grid-2">
            <div>
              <div className="form-group">
                <label className="form-label">Select Seafood Variety</label>
                <select 
                  className="form-input" 
                  value={fishType}
                  onChange={(e) => setFishType(e.target.value)}
                  required
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.species}>
                      {item.species} - ₹{parseFloat(item.current_price_inr || 0).toFixed(2)}/kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Procurement Quantity</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="number" 
                    step="any"
                    className="form-input" 
                    placeholder="e.g. 500" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{ flex: 2 }}
                    required
                  />
                  <select 
                    className="form-input" 
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="tons">Tons (Metric)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Location Address / Warehouse Dock</label>
                <textarea 
                  className="form-input" 
                  rows="2"
                  placeholder="Specify precise port warehouse or depot address in India" 
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Google Maps Link (For exact GPS tracking)</label>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://maps.google.com/?q=..." 
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Pricing Summary Side Card */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div style={{ background: 'var(--bg-ivory)', border: '1px solid var(--color-border-gold)', borderRadius: 'var(--border-radius-lg)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark-primary)', borderBottom: '1px solid var(--color-border-gold)', paddingBottom: '0.75rem' }}>
                  Procurement Summary (₹ INR)
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                  <span>Contract Holder:</span>
                  <span style={{ color: 'var(--text-dark-primary)', fontWeight: '600' }}>{user.name || user.email}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                  <span>Selected Stock:</span>
                  <span style={{ color: 'var(--text-dark-primary)', fontWeight: '600' }}>{fishType || '-'}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                  <span>Unit Rate:</span>
                  <span>₹{selectedPrice.toFixed(2)} / kg</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                  <span>Selected Weight:</span>
                  <span style={{ color: 'var(--color-gold)', fontWeight: '700' }}>
                    {quantity ? `${parseFloat(quantity).toLocaleString()} ${quantityUnit}` : '0'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border-gold)', fontWeight: '700', fontSize: '1.1rem' }}>
                  <span>Estimated Value:</span>
                  <span style={{ color: 'var(--color-gold)' }}>₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.95rem', fontSize: '1rem', marginTop: '1.5rem' }}
                disabled={loading}
              >
                {loading ? 'Transmitting order details...' : 'Submit Procurement Contract'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Orders Ledger / Active Contracts List */}
      <div className="card">
        <h3 style={{ fontSize: '1.35rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark-primary)' }}>Active B2B Procurement Contracts</h3>
        
        {ordersLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark-secondary)' }}><p>Loading shipment records...</p></div>
        ) : myOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark-secondary)' }}>
            <p>You have not placed any wholesale contracts yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="market-table" style={{ fontSize: '0.88rem' }}>
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Cargo Sourced</th>
                  <th>Delivery Port Destination</th>
                  <th>Status</th>
                  <th>Coordinates</th>
                  <th>Freight Transit Tracker</th>
                </tr>
              </thead>
              <tbody>
                {myOrders.map((order) => {
                  const dateString = new Date(order.created_at).toLocaleString();
                  const totalVal = order.total_price_inr || 0;
                  
                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-dark-primary)', fontFamily: 'var(--font-mono)' }}>{order.order_ref || `AJM-ORD-${order.id}`}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dark-secondary)', marginTop: '0.1rem' }}>
                          {dateString}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-dark-primary)' }}>
                          {order.quantity} {order.quantity_unit} of {order.fish_type}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: '600' }}>
                          ₹{parseFloat(totalVal).toLocaleString('en-IN')} INR
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: '0.82rem', color: 'var(--text-dark-secondary)' }}>
                          {order.delivery_location}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${(order.status || 'pending').toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        {order.google_maps_link ? (
                          <a 
                            href={order.google_maps_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-outline-navy"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            Map Link ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dark-secondary)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {order.tracking_link ? (
                          <a 
                            href={order.tracking_link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-primary"
                            style={{ 
                              padding: '0.35rem 0.75rem', 
                              fontSize: '0.72rem', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.3rem'
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            Track Cargo ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-dark-secondary)', fontStyle: 'italic' }}>
                            Awaiting dispatch link
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
