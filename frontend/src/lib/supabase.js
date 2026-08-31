import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mfhhocxxgxjuqiqfhgju.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1maGhvY3h4Z3hqdXFpcWZoZ2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTkxNjMsImV4cCI6MjEwMzY3NTE2M30.IGl0pBUA0LKCUw5Drpbdub38QrqOkClTS0GCUqYFTLY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
