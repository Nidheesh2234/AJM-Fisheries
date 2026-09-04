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
      { id: 2, quote: 'Having instant daily INR rate disclosures makes commercial catering bidding highly predictable. The Google Maps delivery coordinate dropoff ensures local cold-chain logistics run smoothly.', author_name: 'Pranav Sharma', role: 'Logistics Lead, Coastal Dining Group' }
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
      { id: 3, title: 'Wholesale Distributors', description: 'Bulk Bay tiger prawns & catch', image_url: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=400&q=85' },
      { id: 4, title: 'Catering Fleets', description: 'Daily packed distribution units', image_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=85' }
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

  // ---- CERTIFICATIONS CMS ----

  getCertifications: async () => {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('Certifications note:', e.message);
    }
    return [
      { id: 1, label: 'FSSAI Wholesale License', badge_icon_url: '', sort_order: 1 },
      { id: 2, label: 'GST Registered Business', badge_icon_url: '', sort_order: 2 },
      { id: 3, label: 'Zero-Broker Harbour Direct', badge_icon_url: '', sort_order: 3 },
      { id: 4, label: 'Sub-Zero Cold Chain Logistics', badge_icon_url: '', sort_order: 4 },
      { id: 5, label: 'Vizag Health Dept Compliance', badge_icon_url: '', sort_order: 5 }
    ];
  },

  createCertification: async (c) => {
    const { data, error } = await supabase
      .from('certifications')
      .insert({ label: c.label, badge_icon_url: c.badge_icon_url || '', sort_order: parseInt(c.sort_order || 0) })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCertification: async (id, c) => {
    const updatePayload = {};
    if (c.label !== undefined) updatePayload.label = c.label;
    if (c.badge_icon_url !== undefined) updatePayload.badge_icon_url = c.badge_icon_url;
    if (c.sort_order !== undefined) updatePayload.sort_order = parseInt(c.sort_order);

    const { data, error } = await supabase
      .from('certifications')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteCertification: async (id) => {
    const { error } = await supabase.from('certifications').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---- HOW IT WORKS STEPS CMS ----

  getHowItWorksSteps: async () => {
    try {
      const { data, error } = await supabase
        .from('how_it_works_steps')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('step_number', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('How it works steps note:', e.message);
    }
    return [
      { id: 1, step_number: 1, title: 'Harbour Landing', description: 'Our local trawlers dock daily at dawn at Visakhapatnam Fishing Harbour with freshly harvested Bay of Bengal catch.', icon_name: 'anchor', sort_order: 1 },
      { id: 2, step_number: 2, title: 'Sorting & Flake Icing', description: 'Seafood is immediately inspected, graded by size/weight, and layered in sub-zero flake ice crates right on the dock floor.', icon_name: 'snowflake', sort_order: 2 },
      { id: 3, step_number: 3, title: 'Cold Storage Transit', description: 'Loaded directly into temperature-monitored refrigerated transport vans within 60 minutes of dock landing.', icon_name: 'truck', sort_order: 3 },
      { id: 4, step_number: 4, title: 'Your Doorstep Delivery', description: 'Delivered straight to your hotel, restaurant, or commercial kitchen across Vizag and AP with full invoice transparency.', icon_name: 'home', sort_order: 4 }
    ];
  },

  createHowItWorksStep: async (s) => {
    const { data, error } = await supabase
      .from('how_it_works_steps')
      .insert({
        step_number: parseInt(s.step_number || 1),
        title: s.title,
        description: s.description || '',
        icon_name: s.icon_name || 'anchor',
        sort_order: parseInt(s.sort_order || 0)
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateHowItWorksStep: async (id, s) => {
    const updatePayload = {};
    if (s.step_number !== undefined) updatePayload.step_number = parseInt(s.step_number);
    if (s.title !== undefined) updatePayload.title = s.title;
    if (s.description !== undefined) updatePayload.description = s.description;
    if (s.icon_name !== undefined) updatePayload.icon_name = s.icon_name;
    if (s.sort_order !== undefined) updatePayload.sort_order = parseInt(s.sort_order);

    const { data, error } = await supabase
      .from('how_it_works_steps')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteHowItWorksStep: async (id) => {
    const { error } = await supabase.from('how_it_works_steps').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---- CLIENT LOGOS CMS ----

  getClientLogos: async () => {
    try {
      const { data, error } = await supabase
        .from('client_logos')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('Client logos note:', e.message);
    }
    return [
      { id: 1, client_name: 'Grand Coastal Hotel Vizag', logo_url: '', is_placeholder: true, sort_order: 1 },
      { id: 2, client_name: 'Andhra Spice Restaurant Chain', logo_url: '', is_placeholder: true, sort_order: 2 },
      { id: 3, client_name: 'Bayview Luxury Resort & Spa', logo_url: '', is_placeholder: true, sort_order: 3 },
      { id: 4, client_name: 'Oceanic Catering Services', logo_url: '', is_placeholder: true, sort_order: 4 },
      { id: 5, client_name: 'Vizag Seafood Distributors', logo_url: '', is_placeholder: true, sort_order: 5 }
    ];
  },

  createClientLogo: async (c) => {
    const { data, error } = await supabase
      .from('client_logos')
      .insert({
        client_name: c.client_name,
        logo_url: c.logo_url || '',
        is_placeholder: c.is_placeholder !== undefined ? c.is_placeholder : true,
        sort_order: parseInt(c.sort_order || 0)
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateClientLogo: async (id, c) => {
    const updatePayload = {};
    if (c.client_name !== undefined) updatePayload.client_name = c.client_name;
    if (c.logo_url !== undefined) updatePayload.logo_url = c.logo_url;
    if (c.is_placeholder !== undefined) updatePayload.is_placeholder = c.is_placeholder;
    if (c.sort_order !== undefined) updatePayload.sort_order = parseInt(c.sort_order);

    const { data, error } = await supabase
      .from('client_logos')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteClientLogo: async (id) => {
    const { error } = await supabase.from('client_logos').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ---- SITE SETTINGS CMS ----

  getSiteSettings: async () => {
    const defaults = {
      hero_title: "Visakhapatnam's Most Trusted Direct Seafood Partner",
      hero_subtitle: "Direct-from-harbour bulk seafood supply for hotels, restaurant chains, caterers, and regional distributors across Andhra Pradesh. Zero middleman markups, transparent daily pricing in Indian Rupees (₹), and temperature-controlled local logistics.",
      stat_1_num: '10,000+',
      stat_1_label: 'KG Daily Catch',
      stat_2_num: '100%',
      stat_2_label: 'Direct Harbour Sourced',
      stat_3_num: '0%',
      stat_3_label: 'Middlemen Markups',
      stat_4_num: '18+',
      stat_4_label: 'Years Serving Vizag',
      founder_story_title: "From Vizag Harbour Docks to Andhra's Finest Tables",
      founder_story_body: "Founded over 18 years ago at the historic Visakhapatnam Fishing Harbour, AJM Fisheries began with a single trawler and a firm belief: local businesses deserve fresh, unadulterated seafood straight from the harbour floor without paying inflated middleman commissions. Today, we directly serve top culinary institutions, luxury resorts, and high-volume dining establishments across Andhra Pradesh with daily temperature-guaranteed deliveries.",
      founder_name: 'A.J. Mohan & Sons',
      founder_since_year: 'Est. 2008',
      founder_story_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=85',
      about_section_eyebrow: 'DIRECT DOCK OPERATIONS',
      about_section_title: 'The Visakhapatnam Advantage: Freshness Measured in Hours, Not Days',
      about_section_body_1: 'Located right at the Visakhapatnam Fishing Harbour, our dockside processing facility receives catches straight off local trawlers at dawn. Every specimen is inspected, cleaned, size-graded, and iced immediately to lock in ocean freshness.',
      about_section_body_2: 'By eliminating multi-layer wholesale brokers, we give Vizag and Andhra Pradesh chefs guaranteed cold-chain integrity, dependable supply consistency, and honest harbour-direct pricing in INR.',
      how_it_works_eyebrow: 'OUR DIRECT SUPPLY CHAIN',
      how_it_works_title: 'From Harbour Dock to Your Kitchen in 4 Seamless Steps',
      how_it_works_subtitle: 'Experience an uninterrupted cold chain designed specifically for commercial hospitality and food service buyers.',
      closing_cta_headline: "Ready for Direct-from-Harbour Seafood Supply?",
      closing_cta_body: "Join Visakhapatnam's leading hotels, restaurants, and caterers who rely on AJM Fisheries for daily fresh catch, transparent pricing, and guaranteed delivery.",
      closing_cta_button_text: "View Today's Local Rates",
      footer_phone: '+91 891 255 1204',
      footer_email: 'wholesale@ajmfisheries.com',
      footer_gstin: '37AAHCA8492K1Z9',
      footer_address: 'Dockside Gate 4, Vizag Fishing Harbour, Visakhapatnam, 530001, AP, India'
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

