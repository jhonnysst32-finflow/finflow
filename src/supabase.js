import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://lqnpfcjsiahryaawukri.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbnBmY2pzaWFocnlhYXd1a3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NzMzODUsImV4cCI6MjA4NzU0OTM4NX0.Na-yWyR342jaiVyccepuG-5hWGBCDft1nosTpiSwkTY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
