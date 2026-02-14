import { json, badRequest, unauthorized } from '../../response.js';
import { q, run } from '../../db.js';
import { requireAdmin } from '../../auth.js';

export async function apiAdminFeedback(req, env, params){
  const s = await requireAdmin(req, env);
  if(!s.ok) return unauthorized();
  const url = new URL(req.url);

  if(req.method==='GET'){
    const unread = url.searchParams.get('unread')==='1';
    const where = unread ? 'WHERE is_read=0' : '';
    const rows = await q(env, `SELECT id,table_no,message,is_read,created_at FROM feedback ${where} ORDER BY created_at DESC LIMIT 300`);
    return json({ ok:true, messages: rows });
  }

  if(req.method==='PATCH' && params?.id){
    const id = parseInt(params.id,10);
    await run(env, `UPDATE feedback SET is_read=1 WHERE id=?1`, [id]);
    return json({ ok:true });
  }

  return badRequest('نامعتبر');
}
