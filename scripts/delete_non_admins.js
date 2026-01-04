import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

if (!url || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const users = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!data || data.users.length === 0) break;
    users.push(...data.users);
    page++;
  }

  const toDelete = users.filter(u => {
    const isAdminEmail = adminEmails.includes(u.email || '');
    const isAdminId = adminIds.includes(u.id);
    const isAdminMeta = u.user_metadata && (u.user_metadata.role === 'admin' || u.user_metadata.admin_master === true);
    return !(isAdminEmail || isAdminId || isAdminMeta);
  });

  for (const u of toDelete) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) {
      console.error(`Failed to delete ${u.id} ${u.email || ''}: ${error.message}`);
    } else {
      console.log(`Deleted ${u.id} ${u.email || ''}`);
    }
  }
}

run().catch(err => {
  console.error(err.message || String(err));
  process.exit(1);
});
