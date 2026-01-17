import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://glpnkailgttqvyyfeuoo.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXrH_pWoy_s2YTBRvUjmg_cyZl6H4K';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
