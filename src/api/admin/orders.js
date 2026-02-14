import { json, badRequest, unauthorized } from '../../response.js';
import { q, one, run } from '../../db.js';
import { requireAdmin } from '../../auth.js';
import { ORDER_STATUS } from '../../constants.js';

export async function apiAdminOrders(req, env, params){
  const s = await requireAdmin(req, env);
  if(!s.ok) return unauthorized();

  const url = new URL(req.url);

  if(req.method==='GET' && params.mode==='list'){
    const status = url.searchParams.get('status') || ORDER_STATUS.PENDING_WAITER;
    const rows = await q(env, `
      SELECT receipt_code,table_no,status,subtotal_amount,discount_amount,total_amount,customer_note,created_at,accepted_at,paid_at,reject_reason
      FROM orders
      WHERE status=?1
      ORDER BY created_at DESC
      LIMIT 200
    `, [status]);
    return json({ ok:true, orders: rows });
  }

  if(req.method==='GET' && params.mode==='details'){
    const code = params.code;
    const ord = await one(env, `SELECT id,receipt_code,table_no,status,subtotal_amount,discount_amount,total_amount,customer_note,created_at,accepted_at,paid_at,reject_reason FROM orders WHERE receipt_code=?1`, [code]);
    if(!ord) return json({ ok:false, error:'Not found' }, 404);
    const lines = await q(env, `SELECT item_name_snapshot as name,qty,unit_price_snapshot as unit_price,discount_percent_snapshot as discount_percent,final_unit_price_snapshot as final_unit_price,line_total_snapshot as line_total FROM order_items WHERE order_id=?1 ORDER BY id ASC`, [ord.id]);
    return json({ ok:true, order: { ...ord, lines } });
  }

  if(req.method==='PATCH' && params.mode==='accept'){
    const code = params.code;
    const ord = await one(env, `SELECT status FROM orders WHERE receipt_code=?1`, [code]);
    if(!ord) return json({ ok:false, error:'Not found' }, 404);
    if(ord.status !== ORDER_STATUS.PENDING_WAITER) return badRequest('وضعیت سفارش قابل تایید نیست');
    await run(env, `UPDATE orders SET status=?1, accepted_at=strftime('%s','now'), updated_at=strftime('%s','now') WHERE receipt_code=?2`, [ORDER_STATUS.ACCEPTED_WAITER, code]);
    return json({ ok:true });
  }

  if(req.method==='PATCH' && params.mode==='pay'){
    const code = params.code;
    const ord = await one(env, `SELECT status FROM orders WHERE receipt_code=?1`, [code]);
    if(!ord) return json({ ok:false, error:'Not found' }, 404);
    if(ord.status !== ORDER_STATUS.ACCEPTED_WAITER) return badRequest('این سفارش هنوز تایید گارسون نشده');
    await run(env, `UPDATE orders SET status=?1, paid_at=strftime('%s','now'), updated_at=strftime('%s','now') WHERE receipt_code=?2`, [ORDER_STATUS.PAID, code]);
    return json({ ok:true });
  }

  if(req.method==='PATCH' && params.mode==='reject'){
    const code = params.code;
    let body=null;
    try{ body = await req.json(); }catch{}
    const reason = (body?.reason||'').toString().slice(0,200);
    const ord = await one(env, `SELECT status FROM orders WHERE receipt_code=?1`, [code]);
    if(!ord) return json({ ok:false, error:'Not found' }, 404);
    if(ord.status !== ORDER_STATUS.PENDING_WAITER) return badRequest('فقط سفارش‌های جدید قابل رد هستند');
    await run(env, `UPDATE orders SET status=?1, reject_reason=?2, rejected_at=strftime('%s','now'), updated_at=strftime('%s','now') WHERE receipt_code=?3`, [ORDER_STATUS.REJECTED, reason, code]);
    return json({ ok:true });
  }

  return badRequest('نامعتبر');
}
