import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('inventory');
  
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [newSpecies, setNewSpecies] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStatus, setNewStatus] = useState('Available');
  
  const [editingId, setEditingId] = useState(null);
  const [editSpecies, setEditSpecies] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState('Available');

  const [trackingInputs, setTrackingInputs] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'inventory') {
        const data = await api.getInventory();
        setInventory(data || []);
      } else {
        const data = await api.getAllOrders();
        setOrders(data || []);
        
        const inputs = {};
        (data || []).forEach(order => {
          inputs[order.id] = order.tracking_link || '';
        });
        setTrackingInputs(inputs);
      }
    } catch (err) {
      setError(err.message || 'Failed to load panel data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [activeTab, user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <svg style={{ width: '48px', height: '48px', color: 'var(--color-coral)', marginBottom: '1rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-coral)', fontFamily: 'var(--font-serif)' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-dark-secondary)', maxWidth: '440px', margin: '0 auto', fontSize: '0.95rem' }}>
          This interface is reserved for authorized AJM Fisheries executive staff accounts.
        </p>
      </div>
    );
  }

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newSpecies.trim()) {
      setError('Please provide a species name.');
      return;
    }
    if (isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
      setError('Please provide a valid price (greater than or equal to 0).');
      return;
    }

    setSubmitting(true);
    try {
      const newItem = await api.createInventoryItem({
        species: newSpecies,
        current_price_inr: newPrice,
        status: newStatus
      });
      setSuccess(`Successfully added '${newItem.species}' to inventory.`);
      setNewSpecies('');
      setNewPrice('');
      setNewStatus('Available');
      
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to add inventory item.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditSpecies(item.species);
    setEditPrice((item.current_price_inr || 0).toString());
    setEditStatus(item.status);
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    setError('');
    setSuccess('');

    if (!editSpecies.trim()) {
      setError('Please provide a species name.');
      return;
    }
    if (isNaN(parseFloat(editPrice)) || parseFloat(editPrice) < 0) {
      setError('Please provide a valid price.');
      return;
    }

    try {
      const updated = await api.updateInventoryItem(id, {
        species: editSpecies,
        current_price_inr: editPrice,
        status: editStatus
      });
      setSuccess(`Updated '${updated.species}' details successfully.`);
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update inventory item.');
    }
  };

  const handleDeleteInventory = async (id, species) => {
    if (!window.confirm(`Are you sure you want to remove '${species}' from public listings?`)) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      await api.deleteInventoryItem(id);
      setSuccess(`Deleted species '${species}' from the market registry.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete inventory item.');
    }
  };

  const toggleStatus = async (item) => {
    const nextStatus = item.status === 'Available' ? 'Out of Season' : 'Available';
    try {
      await api.updateInventoryItem(item.id, { status: nextStatus });
      loadData();
    } catch (err) {
      setError('Failed to toggle status.');
    }
  };

  const handleStatusChange = async (orderId, nextStatus) => {
    setError('');
    setSuccess('');

    try {
      await api.updateOrder(orderId, { status: nextStatus });
      setSuccess(`Order status updated to ${nextStatus}.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    }
  };

  const handleSaveTracking = async (orderId) => {
    setError('');
    setSuccess('');
    const link = trackingInputs[orderId] || '';

    try {
      await api.updateOrder(orderId, { tracking_link: link });
      setSuccess(`Updated delivery tracking link for order.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update delivery tracking link.');
    }
  };

  return (
    <div>
      {/* Sub-navigation tabs */}
      <div className="auth-tabs" style={{ marginBottom: '2rem' }}>
        <div 
          className={`auth-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => { setActiveTab('inventory'); setSuccess(''); setError(''); }}
        >
          Price Controller (CRUD Inventory - ₹ INR)
        </div>
        
        <div 
          className={`auth-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => { setActiveTab('orders'); setSuccess(''); setError(''); }}
        >
          Order Management Desk ({orders.filter(o => o.status === 'Pending').length} Pending)
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* VIEW: PRICE CONTROLLER */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark-primary)' }}>Add New Seafood Stock Variety</h3>
            <form onSubmit={handleAddInventory} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2, minWidth: '220px', marginBottom: 0 }}>
                <label className="form-label">Seafood Species Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Tiger Prawns (Royyalu)" 
                  value={newSpecies}
                  onChange={(e) => setNewSpecies(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}>
                <label className="form-label">Price per kg (₹ INR)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  placeholder="e.g. 650.00" 
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
                <label className="form-label">Availability Status</label>
                <select 
                  className="form-input" 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Out of Season">Out of Season</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '0.75rem 1.5rem', height: '42px' }}
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Stock'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark-primary)' }}>Vizag Fishing Harbour Inventory Registry</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark-secondary)' }}><p>Retrieving inventory catalog...</p></div>
            ) : inventory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark-secondary)' }}><p>No items inside database registry.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="market-table">
                  <thead>
                    <tr>
                      <th>Species Name</th>
                      <th>Price (₹/kg)</th>
                      <th>Availability</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isEditing = editingId === item.id;
                      const priceVal = item.current_price_inr || 0;
                      
                      return (
                        <tr key={item.id} style={{ backgroundColor: isEditing ? 'rgba(201, 166, 91, 0.04)' : 'transparent' }}>
                          <td>
                            {isEditing ? (
                              <input 
                                type="text" 
                                className="form-input" 
                                value={editSpecies}
                                onChange={(e) => setEditSpecies(e.target.value)}
                              />
                            ) : (
                              <span className="fish-name">{item.species}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input 
                                type="number" 
                                step="0.01" 
                                className="form-input" 
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                style={{ maxWidth: '100px' }}
                              />
                            ) : (
                              <span className="fish-price">₹{parseFloat(priceVal).toFixed(2)}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <select 
                                className="form-input"
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                style={{ maxWidth: '150px' }}
                              >
                                <option value="Available">Available</option>
                                <option value="Out of Season">Out of Season</option>
                              </select>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className={`badge ${item.status === 'Available' ? 'badge-available' : 'badge-outofstock'}`}>
                                  {item.status}
                                </span>
                                <button 
                                  className="navbar-link" 
                                  onClick={() => toggleStatus(item)} 
                                  style={{ fontSize: '0.75rem', textDecoration: 'underline', color: 'var(--text-dark-secondary)' }}
                                >
                                  (Toggle)
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleSaveEdit(item.id)}>
                                  Save
                                </button>
                                <button className="btn btn-outline-navy" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={cancelEditing}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="btn btn-outline-navy" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => startEditing(item)}>
                                  Edit
                                </button>
                                <button 
                                  className="btn btn-danger" 
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} 
                                  onClick={() => handleDeleteInventory(item.id, item.species)}
                                >
                                  Delete
                                </button>
                              </div>
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
      )}

      {/* VIEW: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark-primary)' }}>Incoming Bulk Procurement Order Registry</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark-secondary)' }}><p>Accessing ledger documents...</p></div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dark-secondary)' }}><p>No orders registered in the system ledger.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="market-table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Customer Details</th>
                    <th>Cargo Details</th>
                    <th>Delivery Port Destination</th>
                    <th>Coordinates</th>
                    <th>Transit / Tracking Updates</th>
                    <th>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const dateString = new Date(order.created_at).toLocaleString();
                    const cargoPrice = order.total_price_inr || 0;
                    
                    return (
                      <tr key={order.id}>
                        <td>
                          <div style={{ fontWeight: '700', color: 'var(--text-dark-primary)', fontFamily: 'var(--font-mono)' }}>{order.order_ref || `AJM-ORD-${order.id}`}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-secondary)', marginTop: '0.2rem' }}>
                            {dateString}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-dark-primary)' }}>{order.customer_name || 'B2B Buyer'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--color-gold)' }}>
                            {order.quantity} {order.quantity_unit} of {order.fish_type}
                          </div>
                          {cargoPrice > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-primary)', fontWeight: '600', marginTop: '0.1rem' }}>
                              Value: ₹{parseFloat(cargoPrice).toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ maxWidth: '180px', whiteSpace: 'normal', fontSize: '0.82rem', color: 'var(--text-dark-secondary)' }}>
                            {order.delivery_location}
                          </div>
                        </td>
                        <td>
                          {order.google_maps_link ? (
                            <a 
                              href={order.google_maps_link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-outline-navy"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                            >
                              Maps Link ↗
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dark-secondary)' }}>Not provided</span>
                          )}
                        </td>
                        
                        <td style={{ minWidth: '220px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <input 
                                type="text"
                                className="form-input"
                                placeholder="Paste Courier/Freighter link"
                                value={trackingInputs[order.id] || ''}
                                onChange={(e) => setTrackingInputs({
                                  ...trackingInputs,
                                  [order.id]: e.target.value
                                })}
                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', height: '32px' }}
                              />
                              <button 
                                className="btn btn-primary"
                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', height: '32px' }}
                                onClick={() => handleSaveTracking(order.id)}
                              >
                                Save
                              </button>
                            </div>
                            {order.tracking_link && (
                              <a 
                                href={order.tracking_link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ fontSize: '0.72rem', color: 'var(--color-gold)', textDecoration: 'underline' }}
                              >
                                Active Tracker: View Link ↗
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '130px' }}>
                            <span 
                              className={`badge badge-${(order.status || 'pending').toLowerCase()}`}
                              style={{ textAlign: 'center', alignSelf: 'stretch' }}
                            >
                              {order.status}
                            </span>
                            
                            {order.status === 'Pending' && (
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                                onClick={() => handleStatusChange(order.id, 'Dispatched')}
                              >
                                Mark Dispatched
                              </button>
                            )}

                            {order.status === 'Dispatched' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                                onClick={() => handleStatusChange(order.id, 'Delivered')}
                              >
                                Mark Delivered
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
