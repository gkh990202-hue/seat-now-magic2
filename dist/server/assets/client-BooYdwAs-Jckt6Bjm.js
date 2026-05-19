import { f as createClient } from "./router-Dq4Yi7A5-BEoTr15r.js";
function createSupabaseClient() {
  const SUPABASE_URL = "https://lsargrvgzvllkcqejukt.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_poFKsmjT0CCK9jEiKF41_Q_w3XBYPs0";
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : void 0,
      persistSession: true,
      autoRefreshToken: true
    }
  });
}
let _supabase;
const supabase = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  }
});
export {
  supabase as s
};
