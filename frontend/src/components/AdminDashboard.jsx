import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'orders', 'testimonials', 'partners', 'values', 'settings'
  
  // Data State
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [partnerCards, setPartnerCards] = useState([]);
  const [valueCards, setValueCards] = useState([]);
  const [siteSettings, setSiteSettings] = useState({});

  // Loading & status
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: null, name: '' });

  // ---- Form States ----
  // Inventory Form
  const [invSpecies, setInvSpecies] = useState('');
  const [invLocalName, setInvLocalName] = useState('');
  const [invPrice, setInvPrice] = useState('');
  const [invUnit, setInvUnit] = useState('kg');
  const [invCategory, setInvCategory] = useState('Fish');
  const [invImageUrl, setInvImageUrl] = useState('');
  const [invStatus, setInvStatus] = useState('Available');
  const [editingInvId, setEditingInvId] = useState(null);

  // Orders tracking inputs map
  const [trackingInputs, setTrackingInputs] = useState({});

  // Testimonials Form
  const [testQuote, setTestQuote] = useState('');
  const [testAuthor, setTestAuthor] = useState('');
  const [testRole, setTestRole] = useState('');
  const [editingTestId, setEditingTestId] = useState(null);

  // Partner Cards Form
  const [partnerTitle, setPartnerTitle] = useState('');
  const [partnerDesc, setPartnerDesc] = useState('');
  const [partnerImageUrl, setPartnerImageUrl] = useState('');
  const [editingPartnerId, setEditingPartnerId] = useState(null);

  // Value Cards Form
  const [valueHeading, setValueHeading] = useState('');
  const [valueDesc, setValueDesc] = useState('');
  const [valueImageUrl, setValueImageUrl] = useState('');
  const [editingValueId, setEditingValueId] = useState(null);

  // Site Settings Form
  const [settingsForm, setSettingsForm] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'inventory') {
        const data = await api.getInventory();
        setInventory(data || []);
      } else if (activeTab === 'orders') {
        const data = await api.getAllOrders();
        setOrders(data || []);
        const inputs = {};
        (data || []).forEach(o => { inputs[o.id] = o.tracking_link || ''; });
        setTrackingInputs(inputs);
      } else if (activeTab === 'testimonials') {
        const data = await api.getTestimonials();
        setTestimonials(data || []);
      } else if (activeTab === 'partners') {
        const data = await api.getPartnerCards();
        setPartnerCards(data || []);
      } else if (activeTab === 'values') {
        const data = await api.getValueCards();
        setValueCards(data || []);
      } else if (activeTab === 'settings') {
        const data = await api.getSiteSettings();
        setSiteSettings(data || {});
        setSettingsForm(data || {});
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

  // Image Upload helper (converts uploaded file to Data URL for instant preview & persistence)
  const handleImageFileChange = (e, setUrlFn) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file size should be less than 2MB for optimal performance.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrlFn(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ---- 1. INVENTORY CMS ----
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!invSpecies.trim()) { setError('Please provide a species name.'); return; }
    if (isNaN(parseFloat(invPrice)) || parseFloat(invPrice) < 0) { setError('Please provide a valid price.'); return; }

    setSubmitting(true);
    try {
      if (editingInvId) {
        await api.updateInventoryItem(editingInvId, {
          species: invSpecies,
          local_name: invLocalName,
          current_price_inr: invPrice,
          unit: invUnit,
          category: invCategory,
          image_url: invImageUrl,
          status: invStatus
        });
        setSuccess(`Updated '${invSpecies}' details successfully.`);
        setEditingInvId(null);
      } else {
        await api.createInventoryItem({
          species: invSpecies,
          local_name: invLocalName,
          current_price_inr: invPrice,
          unit: invUnit,
          category: invCategory,
          image_url: invImageUrl,
          sort_order: inventory.length + 1,
          status: invStatus
        });
        setSuccess(`Successfully added '${invSpecies}' to live rates board.`);
      }
      // Reset form
      setInvSpecies(''); setInvLocalName(''); setInvPrice(''); setInvUnit('kg'); setInvCategory('Fish'); setInvImageUrl(''); setInvStatus('Available');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save inventory item.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditInv = (item) => {
    setEditingInvId(item.id);
    setInvSpecies(item.species);
    setInvLocalName(item.local_name || '');
    setInvPrice((item.current_price_inr || 0).toString());
    setInvUnit(item.unit || 'kg');
    setInvCategory(item.category || 'Fish');
    setInvImageUrl(item.image_url || '');
    setInvStatus(item.status || 'Available');
  };

  const cancelEditInv = () => {
    setEditingInvId(null);
    setInvSpecies(''); setInvLocalName(''); setInvPrice(''); setInvUnit('kg'); setInvCategory('Fish'); setInvImageUrl(''); setInvStatus('Available');
  };

  const handleMoveInventory = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= inventory.length) return;

    const newArr = [...inventory];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;

    setInventory(newArr);

    // Update sort_order in database
    try {
      await Promise.all([
        api.updateInventoryItem(newArr[index].id, { sort_order: index + 1 }),
        api.updateInventoryItem(newArr[targetIdx].id, { sort_order: targetIdx + 1 })
      ]);
    } catch (e) {
      console.error('Failed to reorder inventory:', e);
    }
  };

  // ---- 2. ORDERS LOGISTICS ----
  const handleStatusChange = async (orderId, nextStatus) => {
    setError(''); setSuccess('');
    try {
      await api.updateOrder(orderId, { status: nextStatus });
      setSuccess(`Order status updated to ${nextStatus}.`);
      loadData();
    } catch (err) { setError(err.message || 'Failed to update order status.'); }
  };

  const handleSaveTracking = async (orderId) => {
    setError(''); setSuccess('');
    const link = trackingInputs[orderId] || '';
    try {
      await api.updateOrder(orderId, { tracking_link: link });
      setSuccess(`Updated delivery tracking link for order.`);
      loadData();
    } catch (err) { setError(err.message || 'Failed to update delivery tracking link.'); }
  };

  // ---- 3. TESTIMONIALS CMS ----
  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!testQuote.trim() || !testAuthor.trim()) { setError('Quote and Author name are required.'); return; }
    setSubmitting(true);
    try {
      if (editingTestId) {
        await api.updateTestimonial(editingTestId, { quote: testQuote, author_name: testAuthor, role: testRole });
        setSuccess('Testimonial updated successfully.');
        setEditingTestId(null);
      } else {
        await api.createTestimonial({ quote: testQuote, author_name: testAuthor, role: testRole });
        setSuccess('Added new client testimonial.');
      }
      setTestQuote(''); setTestAuthor(''); setTestRole('');
      loadData();
    } catch (err) { setError(err.message || 'Failed to save testimonial.'); }
    finally { setSubmitting(false); }
  };

  const startEditTest = (item) => {
    setEditingTestId(item.id);
    setTestQuote(item.quote);
    setTestAuthor(item.author_name);
    setTestRole(item.role || '');
  };

  // ---- 4. PARTNER CARDS CMS ----
  const handleSavePartnerCard = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!partnerTitle.trim()) { setError('Title is required.'); return; }
    setSubmitting(true);
    try {
      if (editingPartnerId) {
        await api.updatePartnerCard(editingPartnerId, { title: partnerTitle, description: partnerDesc, image_url: partnerImageUrl });
        setSuccess('Partner network card updated.');
        setEditingPartnerId(null);
      } else {
        await api.createPartnerCard({ title: partnerTitle, description: partnerDesc, image_url: partnerImageUrl });
        setSuccess('Added new partner network card.');
      }
      setPartnerTitle(''); setPartnerDesc(''); setPartnerImageUrl('');
      loadData();
    } catch (err) { setError(err.message || 'Failed to save partner card.'); }
    finally { setSubmitting(false); }
  };

  const startEditPartner = (item) => {
    setEditingPartnerId(item.id);
    setPartnerTitle(item.title);
    setPartnerDesc(item.description || '');
    setPartnerImageUrl(item.image_url || '');
  };

  // ---- 5. VALUE CARDS CMS ----
  const handleSaveValueCard = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!valueHeading.trim()) { setError('Heading is required.'); return; }
    setSubmitting(true);
    try {
      if (editingValueId) {
        await api.updateValueCard(editingValueId, { heading: valueHeading, description: valueDesc, image_url: valueImageUrl });
        setSuccess('Value & Logistics card updated.');
        setEditingValueId(null);
      } else {
        await api.createValueCard({ heading: valueHeading, description: valueDesc, image_url: valueImageUrl });
        setSuccess('Added new Industrial Sourcing & Logistics card.');
      }
      setValueHeading(''); setValueDesc(''); setValueImageUrl('');
      loadData();
    } catch (err) { setError(err.message || 'Failed to save value card.'); }
    finally { setSubmitting(false); }
  };

  const startEditValue = (item) => {
    setEditingValueId(item.id);
    setValueHeading(item.heading);
    setValueDesc(item.description || '');
    setValueImageUrl(item.image_url || '');
  };

  // ---- 6. SITE SETTINGS CMS ----
  const handleSaveSiteSettings = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSubmitting(true);
    try {
      await api.updateSiteSettings(settingsForm);
      setSuccess('Site content settings and stat blocks saved successfully! Home page reflects changes immediately.');
      setSiteSettings(settingsForm);
    } catch (err) { setError(err.message || 'Failed to update site settings.'); }
    finally { setSubmitting(false); }
  };

  // ---- DELETE CONFIRMATION HANDLER ----
  const confirmDeleteAction = async () => {
    const { type, id } = deleteModal;
    setSubmitting(true);
    try {
      if (type === 'inventory') await api.deleteInventoryItem(id);
      else if (type === 'testimonial') await api.deleteTestimonial(id);
      else if (type === 'partner') await api.deletePartnerCard(id);
      else if (type === 'value') await api.deleteValueCard(id);
      
      setSuccess('Item removed successfully.');
      setDeleteModal({ open: false, type: '', id: null, name: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* CMS Sub-navigation Tabs */}
      <div className="auth-tabs" style={{ gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--color-border-gold)' }}>
        <div className={`auth-tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          Live Rates Board
        </div>
        <div className={`auth-tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          Orders Desk ({orders.filter(o => o.status === 'Pending').length})
        </div>
        <div className={`auth-tab ${activeTab === 'testimonials' ? 'active' : ''}`} onClick={() => setActiveTab('testimonials')}>
          Testimonials
        </div>
        <div className={`auth-tab ${activeTab === 'partners' ? 'active' : ''}`} onClick={() => setActiveTab('partners')}>
          Partner Network
        </div>
        <div className={`auth-tab ${activeTab === 'values' ? 'active' : ''}`} onClick={() => setActiveTab('values')}>
          Value & Logistics
        </div>
        <div className={`auth-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          Site Content & Stats
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* ============================================================
          1. LIVE RATES / INVENTORY CMS
         ============================================================ */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Add / Edit Inventory Form */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark-primary)' }}>
              {editingInvId ? 'Edit Seafood Entry' : '+ Add New Seafood Entry'}
            </h3>
            
            <form onSubmit={handleSaveInventory} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Species Name</label>
                  <input type="text" className="form-input" placeholder="e.g. White Pomfret" value={invSpecies} onChange={(e) => setInvSpecies(e.target.value)} required />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Local Name (Telugu/Regional)</label>
                  <input type="text" className="form-input" placeholder="e.g. Chanduva" value={invLocalName} onChange={(e) => setInvLocalName(e.target.value)} />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Price in INR (₹)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="e.g. 850.00" value={invPrice} onChange={(e) => setInvPrice(e.target.value)} required />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Unit</label>
                  <select className="form-input" value={invUnit} onChange={(e) => setInvUnit(e.target.value)}>
                    <option value="kg">per kg</option>
                    <option value="ton">per Ton</option>
                    <option value="piece">per Piece</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                    <option value="Fish">Fish</option>
                    <option value="Shellfish">Shellfish</option>
                    <option value="Crab">Crab</option>
                    <option value="Lobster">Lobster</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={invStatus} onChange={(e) => setInvStatus(e.target.value)}>
                    <option value="Available">Available</option>
                    <option value="Out of Season">Out of Season</option>
                  </select>
                </div>
              </div>

              {/* Image URL & File Upload Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fish Photo Image URL or Local Photo Upload</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="url" className="form-input" placeholder="Paste image URL (https://...)" value={invImageUrl} onChange={(e) => setInvImageUrl(e.target.value)} style={{ flex: 2 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dark-secondary)' }}>or</span>
                  <input type="file" accept="image/*" className="btn btn-outline-navy" style={{ flex: 1, padding: '0.5rem' }} onChange={(e) => handleImageFileChange(e, setInvImageUrl)} />
                </div>
                
                {/* Live Preview Thumbnail */}
                {invImageUrl && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={invImageUrl} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--color-border-gold)' }} />
                    <button type="button" className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setInvImageUrl('')}>
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingInvId ? 'Update Entry' : '+ Add Entry'}
                </button>
                {editingInvId && (
                  <button type="button" className="btn btn-outline-navy" onClick={cancelEditInv}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Inventory Table with Reordering & Image Thumbnails */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark-primary)' }}>
              Live Market Rates Registry
            </h3>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>Loading entries...</p>
            ) : inventory.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No entries found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="market-table">
                  <thead>
                    <tr>
                      <th>Reorder</th>
                      <th>Thumbnail</th>
                      <th>Species & Local Name</th>
                      <th>Category</th>
                      <th>Price per Unit</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ width: '70px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <button className="btn btn-outline-navy" style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }} disabled={idx === 0} onClick={() => handleMoveInventory(idx, -1)}>▲</button>
                            <button className="btn btn-outline-navy" style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem' }} disabled={idx === inventory.length - 1} onClick={() => handleMoveInventory(idx, 1)}>▼</button>
                          </div>
                        </td>
                        <td>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.species} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--color-border-gold)' }} />
                          ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(201, 166, 91, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold)' }}>🐟</div>
                          )}
                        </td>
                        <td>
                          <div className="fish-name">{item.species}</div>
                          {item.local_name && <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)' }}>{item.local_name}</div>}
                        </td>
                        <td>{item.category || 'Fish'}</td>
                        <td><span className="fish-price">₹{parseFloat(item.current_price_inr || 0).toFixed(2)}</span> /{item.unit || 'kg'}</td>
                        <td><span className={`badge ${item.status === 'Available' ? 'badge-available' : 'badge-outofstock'}`}>{item.status}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline-navy" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => startEditInv(item)}>Edit</button>
                            <button className="btn btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setDeleteModal({ open: true, type: 'inventory', id: item.id, name: item.species })}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          2. ORDERS DESK
         ============================================================ */}
      {activeTab === 'orders' && (
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark-primary)' }}>Incoming Procurement Orders</h3>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>No orders in ledger.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="market-table" style={{ fontSize: '0.88rem' }}>
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Customer</th>
                    <th>Cargo Sourced</th>
                    <th>Destination</th>
                    <th>Coordinates</th>
                    <th>Tracking Updates</th>
                    <th>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{order.order_ref || `AJM-ORD-${order.id}`}</td>
                      <td>{order.customer_name || 'B2B Buyer'}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--color-gold)' }}>{order.quantity} {order.quantity_unit} of {order.fish_type}</div>
                        <div>Value: ₹{parseFloat(order.total_price_inr || 0).toLocaleString('en-IN')}</div>
                      </td>
                      <td style={{ maxWidth: '180px' }}>{order.delivery_location}</td>
                      <td>
                        {order.google_maps_link ? <a href={order.google_maps_link} target="_blank" rel="noopener noreferrer" className="btn btn-outline-navy" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>Map Link ↗</a> : 'N/A'}
                      </td>
                      <td style={{ minWidth: '220px' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <input type="text" className="form-input" placeholder="Paste tracking link" value={trackingInputs[order.id] || ''} onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })} style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', height: '32px' }} />
                          <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', height: '32px' }} onClick={() => handleSaveTracking(order.id)}>Save</button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '130px' }}>
                          <span className={`badge badge-${(order.status || 'pending').toLowerCase()}`}>{order.status}</span>
                          {order.status === 'Pending' && <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleStatusChange(order.id, 'Dispatched')}>Mark Dispatched</button>}
                          {order.status === 'Dispatched' && <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleStatusChange(order.id, 'Delivered')}>Mark Delivered</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          3. TESTIMONIALS CMS
         ============================================================ */}
      {activeTab === 'testimonials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>{editingTestId ? 'Edit Testimonial' : '+ Add New Testimonial'}</h3>
            <form onSubmit={handleSaveTestimonial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Client Quote</label>
                <textarea className="form-input" rows="3" placeholder="Enter quote text..." value={testQuote} onChange={(e) => setTestQuote(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Author Name</label>
                  <input type="text" className="form-input" placeholder="e.g. N. Ramakrishna" value={testAuthor} onChange={(e) => setTestAuthor(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role / Company Title</label>
                  <input type="text" className="form-input" placeholder="e.g. Culinary Director, Grand Andhra Resort" value={testRole} onChange={(e) => setTestRole(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{editingTestId ? 'Update Testimonial' : '+ Add Testimonial'}</button>
                {editingTestId && <button type="button" className="btn btn-outline-navy" onClick={() => { setEditingTestId(null); setTestQuote(''); setTestAuthor(''); setTestRole(''); }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>Active Testimonials</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {testimonials.map(t => (
                <div key={t.id} style={{ padding: '1.25rem', background: 'var(--bg-ivory)', border: '1px solid var(--color-border-gold)', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontStyle: 'italic', marginBottom: '0.4rem' }}>"{t.quote}"</p>
                    <strong style={{ color: 'var(--color-gold)' }}>{t.author_name}</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-dark-secondary)' }}>({t.role})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline-navy" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => startEditTest(t)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setDeleteModal({ open: true, type: 'testimonial', id: t.id, name: t.author_name })}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          4. PARTNER NETWORK CMS
         ============================================================ */}
      {activeTab === 'partners' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>{editingPartnerId ? 'Edit Partner Card' : '+ Add Partner Card'}</h3>
            <form onSubmit={handleSavePartnerCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category Title</label>
                  <input type="text" className="form-input" placeholder="e.g. Five-Star Hotels" value={partnerTitle} onChange={(e) => setPartnerTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Description</label>
                  <input type="text" className="form-input" placeholder="e.g. Premium pomfret & lobster" value={partnerDesc} onChange={(e) => setPartnerDesc(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Thumbnail Photo Image URL or Upload</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="url" className="form-input" placeholder="https://..." value={partnerImageUrl} onChange={(e) => setPartnerImageUrl(e.target.value)} style={{ flex: 2 }} />
                  <input type="file" accept="image/*" className="btn btn-outline-navy" style={{ flex: 1, padding: '0.5rem' }} onChange={(e) => handleImageFileChange(e, setPartnerImageUrl)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{editingPartnerId ? 'Update Card' : '+ Add Card'}</button>
                {editingPartnerId && <button type="button" className="btn btn-outline-navy" onClick={() => { setEditingPartnerId(null); setPartnerTitle(''); setPartnerDesc(''); setPartnerImageUrl(''); }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>Partner Network Cards</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {partnerCards.map(c => (
                <div key={c.id} style={{ padding: '1.25rem', background: 'var(--bg-ivory)', border: '1px solid var(--color-border-gold)', borderRadius: 'var(--border-radius-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {c.image_url && <img src={c.image_url} alt={c.title} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem' }}>{c.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dark-secondary)' }}>{c.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <button className="btn btn-outline-navy" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => startEditPartner(c)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => setDeleteModal({ open: true, type: 'partner', id: c.id, name: c.title })}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          5. VALUE CARDS CMS
         ============================================================ */}
      {activeTab === 'values' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>{editingValueId ? 'Edit Value & Logistics Card' : '+ Add Value Card'}</h3>
            <form onSubmit={handleSaveValueCard} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Heading</label>
                <input type="text" className="form-input" placeholder="e.g. Direct Fleet Sourcing" value={valueHeading} onChange={(e) => setValueHeading(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="2" placeholder="Card body text..." value={valueDesc} onChange={(e) => setValueDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Card Header Photo Image URL or Upload</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input type="url" className="form-input" placeholder="https://..." value={valueImageUrl} onChange={(e) => setValueImageUrl(e.target.value)} style={{ flex: 2 }} />
                  <input type="file" accept="image/*" className="btn btn-outline-navy" style={{ flex: 1, padding: '0.5rem' }} onChange={(e) => handleImageFileChange(e, setValueImageUrl)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{editingValueId ? 'Update Card' : '+ Add Card'}</button>
                {editingValueId && <button type="button" className="btn btn-outline-navy" onClick={() => { setEditingValueId(null); setValueHeading(''); setValueDesc(''); setValueImageUrl(''); }}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>Value & Logistics Cards</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {valueCards.map(v => (
                <div key={v.id} style={{ padding: '1.25rem', background: 'var(--bg-ivory)', border: '1px solid var(--color-border-gold)', borderRadius: 'var(--border-radius-md)' }}>
                  {v.image_url && <img src={v.image_url} alt={v.heading} style={{ width: '100%', height: '140px', borderRadius: '8px', objectFit: 'cover', marginBottom: '0.75rem' }} />}
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>{v.heading}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dark-secondary)', marginBottom: '1rem' }}>{v.description}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline-navy" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => startEditValue(v)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setDeleteModal({ open: true, type: 'value', id: v.id, name: v.heading })}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          6. SITE SETTINGS & STAT BLOCKS CMS
         ============================================================ */}
      {activeTab === 'settings' && (
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>Site Content & Stat Blocks Manager</h3>
          <form onSubmit={handleSaveSiteSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Hero Section Content */}
            <div style={{ background: 'var(--bg-ivory)', padding: '1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-gold)' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--color-gold)', marginBottom: '0.85rem' }}>Hero Section Typography</h4>
              <div className="form-group">
                <label className="form-label">Hero Main Title</label>
                <input type="text" className="form-input" value={settingsForm.hero_title || ''} onChange={(e) => setSettingsForm({ ...settingsForm, hero_title: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hero Subtitle</label>
                <textarea className="form-input" rows="3" value={settingsForm.hero_subtitle || ''} onChange={(e) => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })} required />
              </div>
            </div>

            {/* Stat Blocks */}
            <div style={{ background: 'var(--bg-ivory)', padding: '1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-gold)' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--color-gold)', marginBottom: '0.85rem' }}>Stats Cards (Home Page)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label">Stat 1 Value</label>
                  <input type="text" className="form-input" value={settingsForm.stat_1_num || ''} onChange={(e) => setSettingsForm({ ...settingsForm, stat_1_num: e.target.value })} />
                  <label className="form-label" style={{ marginTop: '0.4rem' }}>Stat 1 Label</label>
                  <input type="text" className="form-input" value={settingsForm.stat_1_label || ''} onChange={(e) => setSettingsForm({ ...settingsForm, stat_1_label: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Stat 2 Value</label>
                  <input type="text" className="form-input" value={settingsForm.stat_2_num || ''} onChange={(e) => setSettingsForm({ ...settingsForm, stat_2_num: e.target.value })} />
                  <label className="form-label" style={{ marginTop: '0.4rem' }}>Stat 2 Label</label>
                  <input type="text" className="form-input" value={settingsForm.stat_2_label || ''} onChange={(e) => setSettingsForm({ ...settingsForm, stat_2_label: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Stat 3 Value</label>
                  <input type="text" className="form-input" value={settingsForm.stat_3_num || ''} onChange={(e) => setSettingsForm({ ...settingsForm, stat_3_num: e.target.value })} />
                  <label className="form-label" style={{ marginTop: '0.4rem' }}>Stat 3 Label</label>
                  <input type="text" className="form-input" value={settingsForm.stat_3_label || ''} onChange={(e) => setSettingsForm({ ...settingsForm, stat_3_label: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Footer & Contact Settings */}
            <div style={{ background: 'var(--bg-ivory)', padding: '1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-gold)' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--color-gold)', marginBottom: '0.85rem' }}>Footer & Corporate Contact Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Desk</label>
                  <input type="text" className="form-input" value={settingsForm.footer_phone || ''} onChange={(e) => setSettingsForm({ ...settingsForm, footer_phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Desk</label>
                  <input type="text" className="form-input" value={settingsForm.footer_email || ''} onChange={(e) => setSettingsForm({ ...settingsForm, footer_email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">GSTIN Number</label>
                  <input type="text" className="form-input" value={settingsForm.footer_gstin || ''} onChange={(e) => setSettingsForm({ ...settingsForm, footer_gstin: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Harbour Office Address</label>
                  <input type="text" className="form-input" value={settingsForm.footer_address || ''} onChange={(e) => setSettingsForm({ ...settingsForm, footer_address: e.target.value })} />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', fontSize: '1rem' }} disabled={submitting}>
              {submitting ? 'Saving Settings...' : 'Save Site Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={deleteModal.open}
        itemName={deleteModal.name}
        onClose={() => setDeleteModal({ open: false, type: '', id: null, name: '' })}
        onConfirm={confirmDeleteAction}
        loading={submitting}
      />

    </div>
  );
}
