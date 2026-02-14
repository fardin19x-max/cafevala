import { json, badRequest, unauthorized } from '../../response.js';
import { q } from '../../db.js';
import { requireAdmin } from '../../auth.js';

export async function apiAdminReports(req, env){
  const s = await requireAdmin(req, env);
  if(!s.ok) return unauthorized();
  const url = new URL(req.url);
  const day = url.searchParams.get('day');

  // daily report (UTC day)
  if(req.method==='GET'){
    let start, end;
    if(day){
      const m = /^\d{4}-\d{2}-\d{2}$/.test(day);
      if(!m) return badRequest('day');
      const d0 = new Date(day+'T00:00:00Z');
      start = Math.floor(d0.getTime()/1000);
      end = start + 86400;
    }else{
      const now = new Date();
      const d0 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      start = Math.floor(d0.getTime()/1000);
      end = start + 86400;
    }

    const paid = await q(env, `
      SELECT receipt_code,table_no,total_amount,created_at,paid_at
      FROM orders
      WHERE status='paid' AND paid_at>=?1 AND paid_at<?2
      ORDER BY paid_at DESC
    `, [start,end]);

    const sumRow = await q(env, `
      SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as count
      FROM orders
      WHERE status='paid' AND paid_at>=?1 AND paid_at<?2
    `, [start,end]);

    return json({ ok:true, range:{ start, end }, summary: sumRow[0]||{total:0,count:0}, orders: paid });
  }

  return badRequest('نامعتبر');
}
