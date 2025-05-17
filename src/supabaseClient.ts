import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lpbxgnjlketmbowubqvp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwYnhnbmpsa2V0bWJvd3VicXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MTAwNzQsImV4cCI6MjA2MjQ4NjA3NH0.fYBC_qmxiiZW3POPwRNRYN97mMF_kw4FovvD-DFOg40';

export const supabase = createClient(supabaseUrl, supabaseKey);

