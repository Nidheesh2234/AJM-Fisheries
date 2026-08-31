import { supabase } from '../lib/supabase';

// ============================================================
// AJM Fisheries — Supabase API Layer
// All data flows through the Supabase JS client.
// ============================================================

export const api = {

  // ---- AUTH ----

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
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
        // Fallback if profile row isn't populated yet
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

  // ---- INVENTORY ----

  getInventory: async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return data;
  },

  createInventoryItem: async (item) => {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        species: item.species,
        current_price_inr: parseFloat(item.current_price_inr),
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
    if (updates.current_price_inr !== undefined) updatePayload.current_price_inr = parseFloat(updates.current_price_inr);
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
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
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
    // Generate AJM-ORD-xxxxxx reference
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
};
