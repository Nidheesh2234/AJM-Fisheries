import { supabase } from '../lib/supabase';

// ============================================================
// AJM Fisheries — Supabase API Layer (Full CMS Enabled)
// ============================================================

export const api = {

  // ---- AUTH ----

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // ---- PROFILES ----

  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return {
          id: userId,
          full_name: 'B2B Client',
          role: 'customer',
          delivery_address: '',
          google_maps_link: ''
        };
      }
      return data;
    } catch (err) {
      console.warn('Profile lookup note:', err.message);
      return {
        id: userId,
        full_name: 'B2B Client',
        role: 'customer',
        delivery_address: '',
        google_maps_link: ''
      };
    }
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- INVENTORY / LIVE RATES ----

  getInventory: async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('Inventory fetch note:', e.message);
    }

    // Default fallback
    return [
      { id: 1, species: 'White Pomfret', local_name: 'Chanduva', current_price_inr: 850, unit: 'kg', category: 'Fish', image_url: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=600&q=85', sort_order: 1, status: 'Available' },
      { id: 2, species: 'Seer Fish / Kingfish', local_name: 'Konema', current_price_inr: 950, unit: 'kg', category: 'Fish', image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=85', sort_order: 2, status: 'Available' },
      { id: 3, species: 'Bay Tiger Prawns', local_name: 'Royyalu', current_price_inr: 650, unit: 'kg', category: 'Shellfish', image_url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=85', sort_order: 3, status: 'Available' },
      { id: 4, species: 'Indian Mackerel', local_name: 'Kanagarthalu', current_price_inr: 250, unit: 'kg', category: 'Fish', image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=85', sort_order: 4, status: 'Available' },
      { id: 5, species: 'Vizag Mud Crab', local_name: 'Peethalu', current_price_inr: 450, unit: 'kg', category: 'Crab', image_url: 'https://images.unsplash.com/photo-1559737671-67858c142e05?auto=format&fit=crop&w=600&q=85', sort_order: 5, status: 'Out of Season' },
      { id: 6, species: 'Bay Yellowfin Tuna', local_name: 'Soora', current_price_inr: 750, unit: 'kg', category: 'Fish', image_url: 'https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&w=600&q=85', sort_order: 6, status: 'Available' }
    ];
  },

  createInventoryItem: async (item) => {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        species: item.species,
        local_name: item.local_name || '',
        current_price_inr: parseFloat(item.current_price_inr),
        unit: item.unit || 'kg',
        category: item.category || 'Fish',
        image_url: item.image_url || '',
        sort_order: item.sort_order ? parseInt(item.sort_order) : 0,
        status: item.status || 'Available',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateInventoryItem: async (id, updates) => {
    const updatePayload = {};
    if (updates.species !== undefined) updatePayload.species = updates.species;
    if (updates.local_name !== undefined) updatePayload.local_name = updates.local_name;
    if (updates.current_price_inr !== undefined) updatePayload.current_price_inr = parseFloat(updates.current_price_inr);
    if (updates.unit !== undefined) updatePayload.unit = updates.unit;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.image_url !== undefined) updatePayload.image_url = updates.image_url;
    if (updates.sort_order !== undefined) updatePayload.sort_order = parseInt(updates.sort_order);
    if (updates.status !== undefined) updatePayload.status = updates.status;

    const { data, error } = await supabase
      .from('inventory')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteInventoryItem: async (id) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---- ORDERS ----

  getMyOrders: async (userId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getAllOrders: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createOrder: async (order) => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderRef = `AJM-ORD-${randomSuffix}`;

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_ref: orderRef,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        fish_type: order.fish_type,
        quantity: parseFloat(order.quantity),
        quantity_unit: order.quantity_unit || 'kg',
        total_price_inr: parseFloat(order.total_price_inr),
        delivery_location: order.delivery_location,
        google_maps_link: order.google_maps_link,
        tracking_link: '',
        status: 'Pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateOrder: async (id, updates) => {
    const updatePayload = {};
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.tracking_link !== undefined) updatePayload.tracking_link = updates.tracking_link;

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ---- TESTIMONIALS CMS ----

  getTestimonials: async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('Testimonials note:', e.message);
    }
    return [
      { id: 1, quote: 'Transitioning our seafood procurement to AJM Fisheries Vizag cut our supply chains by 3 days. The Seer Fish arrives in perfect cold-chain condition directly at our RK Beach hotel depot.', author_name: 'N. Ramakrishna', role: 'Culinary Director, Grand Andhra Resort' },
      { id: 2, quote: 'Having instant daily INR rate disclosures makes commercial catering bidding highly predictable. The Google Maps delivery coordinate dropoff ensures cargo container logistics run smoothly.', author_name: 'Pranav Sharma', role: 'Logistics Lead, Oceanic Processors Ltd' }
    ];
  },

  createTestimonial: async (t) => {
    const { data, error } = await supabase
      .from('testimonials')
      .insert({ quote: t.quote, author_name: t.author_name, role: t.role || '' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateTestimonial: async (id, t) => {
    const { data, error } = await supabase
      .from('testimonials')
      .update({ quote: t.quote, author_name: t.author_name, role: t.role })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteTestimonial: async (id) => {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---- PARTNER CARDS CMS ----

  getPartnerCards: async () => {
    try {
      const { data, error } = await supabase
        .from('partner_cards')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('Partner cards note:', e.message);
    }
    return [
      { id: 1, title: 'Five-Star Hotels', description: 'Premium pomfret & lobster', image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=85' },
      { id: 2, title: 'Restaurant Chains', description: 'Consistent wholesale fish supply', image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=85' },
      { id: 3, title: 'Export Houses', description: 'Flash-frozen tiger prawns', image_url: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=400&q=85' },
      { id: 4, title: 'Supermarket Docks', description: 'Daily packed distribution units', image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=85' }
    ];
  },

  createPartnerCard: async (c) => {
    const { data, error } = await supabase
      .from('partner_cards')
      .insert({ title: c.title, description: c.description || '', image_url: c.image_url || '' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updatePartnerCard: async (id, c) => {
    const { data, error } = await supabase
      .from('partner_cards')
      .update({ title: c.title, description: c.description, image_url: c.image_url })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deletePartnerCard: async (id) => {
    const { error } = await supabase.from('partner_cards').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---- VALUE CARDS CMS ----

  getValueCards: async () => {
    try {
      const { data, error } = await supabase
        .from('value_cards')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('Value cards note:', e.message);
    }
    return [
      { id: 1, heading: 'Direct Fleet Sourcing', description: 'Our fleet navigates the deep waters of the Bay of Bengal, returning fresh catches directly to our private docks at Visakhapatnam harbour.', image_url: 'https://images.unsplash.com/photo-1504470695779-75300268aa0e?auto=format&fit=crop&w=800&q=85' },
      { id: 2, heading: 'Price Transparency', description: 'No hidden brokerage fees. Daily updated INR rates are published directly from dock landing ledgers onto our digital market board.', image_url: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?auto=format&fit=crop&w=800&q=85' },
      { id: 3, heading: 'GPS Tracked Cold-Chain', description: 'Transported in temperature-monitored refrigerated freighter containers. Deliveries are dispatched using Google Maps coordinate tracking.', image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=85' }
    ];
  },

  createValueCard: async (c) => {
    const { data, error } = await supabase
      .from('value_cards')
      .insert({ heading: c.heading, description: c.description || '', image_url: c.image_url || '' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateValueCard: async (id, c) => {
    const { data, error } = await supabase
      .from('value_cards')
      .update({ heading: c.heading, description: c.description, image_url: c.image_url })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteValueCard: async (id) => {
    const { error } = await supabase.from('value_cards').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---- SITE SETTINGS CMS ----

  getSiteSettings: async () => {
    const defaults = {
      hero_title: "Fresh From Vizag's Waters To Your Business",
      hero_subtitle: 'Direct-from-ocean bulk seafood supply. Zero middleman markups, transparent daily pricing in Indian Rupees (₹), and temperature-controlled container logistics for luxury hotels, restaurant chains, exporters, and regional distributors nationwide.',
      stat_1_num: '10K+',
      stat_1_label: 'KG Daily',
      stat_2_num: '100%',
      stat_2_label: 'Vizag Coast',
      stat_3_num: '0%',
      stat_3_label: 'Middlemen',
      footer_phone: '+91 891 255 1204',
      footer_email: 'bulk@ajmfisheries.com',
      footer_gstin: '37AAHCA8492K1Z9',
      footer_address: 'Vizag Fishing Harbour, Visakhapatnam, 530001, AP, India'
    };

    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        const settings = { ...defaults };
        data.forEach(item => {
          settings[item.key] = item.value;
        });
        return settings;
      }
    } catch (e) {
      console.warn('Site settings note:', e.message);
    }
    return defaults;
  },

  updateSiteSetting: async (key, value) => {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateSiteSettings: async (settingsObj) => {
    const payload = Object.keys(settingsObj).map(k => ({
      key: k,
      value: settingsObj[k],
      updated_at: new Date().toISOString()
    }));
    const { data, error } = await supabase.from('site_settings').upsert(payload);
    if (error) throw error;
    return data;
  }
};
