import { json, badRequest } from '../../response.js';
import { one, sha256Hex } from '../../db.js';
import { createSessionCookie, clearSessionCookie, requireAdmin } from '../../auth.js';

async function readJson(req){
  try{ return await req.json(); }catch{ return null; }
}

export async function apiAdminLogin(req, env){
  if(req.method!=='POST') return badRequest('روش نامعتبر');
  const body = await readJson(req);
  if(!body) return badRequest('بدنه نامعتبر');
  const username = (body.username||'').toString().trim();
  const password = (body.password||'').toString();
  if(!username || !password) return badRequest('نام کاربری/رمز لازم است');

  const row = await one(env, `SELECT username, pass_hash FROM admins WHERE username=?1`, [username]);
  if(!row) return json({ ok:false, error:'اطلاعات ورود اشتباه است' }, 401);
  const h = await sha256Hex(password);
  if(h !== row.pass_hash) return json({ ok:false, error:'اطلاعات ورود اشتباه است' }, 401);

  const cookie = await createSessionCookie(env, username);
  return json({ ok:true, username }, 200, { 'set-cookie': cookie });
}

export async function apiAdminLogout(req, env){
  const cookie = await clearSessionCookie();
  return json({ ok:true }, 200, { 'set-cookie': cookie });
}

export async function apiAdminMe(req, env){
  const s = await requireAdmin(req, env);
  if(!s.ok) return json({ ok:false }, 401);
  return json({ ok:true, username: s.username });
}
