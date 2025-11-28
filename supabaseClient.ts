import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zhdkhdsrvtxpovhxtkvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZGtoZHNydnR4cG92aHh0a3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNDAxOTIsImV4cCI6MjA3OTkxNjE5Mn0.rApexm8DpkVc9URfQHtcTsEZ-HLpVZtWAp-tyUSfVx0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
