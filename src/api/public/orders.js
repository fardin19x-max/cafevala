import { json, badRequest } from '../../response.js';
import { q, one, run, tx } from '../../db.js';
import { getSetting, nextReceiptCode } from '../../settings.js';
import { ORDER_STATUS } from '../../constants.js';

async function loadActiveDiscounts(env){
  const rows = await q(env, `
    SELECT scope, target_id, percent
    FROM discount_rules
    WHERE is_active=1
      AND (starts_at IS NULL OR starts_at <= strftime('%s','now'))
      AND (ends_at   IS NULL OR ends_at   >= strftime('%s','now'))
  `);
  const item = new Map();
  const cat = new Map();
  for(const r of rows){
    if(r.scope==='item') item.set(r.target_id, r.percent);
    if(r.scope==='category') cat.set(r.target_id, r.percent);
  }
  return { item, cat };
}

function applyDiscount(price, percent){
  const off = Math.floor((price * percent) / 100);
  return { final_unit_price: price - off, off };
}

async function readJson(req){
  try{ return await req.json(); }catch{ return null; }
}

export async function apiOrders(req, env, params){
  if(req.method==='POST' && params?.mode==='create'){
    const shopOpen = await getSetting(env, 'shop_open', '1');
    if(String(shopOpen)!=='1'){
      const msg = await getSetting(env, 'shop_message', 'الان سفارش‌گیری غیرفعال است');
      return json({ ok:false, error: msg }, 409);
    }

    const body = await readJson(req);
    if(!body) return badRequest('بدنه نامعتبر است');

    const table_no = parseInt(body.table_no, 10);
    if(!Number.isFinite(table_no) || table_no<=0 || table_no>999) return badRequest('شماره میز نامعتبر است');

    const lines = Array.isArray(body.lines) ? body.lines : [];
    if(lines.length===0) return badRequest('سبد خالی است');

    const note = (body.note || '').toString().slice(0, 500);

    // Normalize lines
    const norm = [];
    const counts = new Map();
    for(const ln of lines){
      const item_id = parseInt(ln.item_id,10);
      const qty = parseInt(ln.qty,10);
      if(!Number.isFinite(item_id) || !Number.isFinite(qty) || qty<=0) continue;
      counts.set(item_id, (counts.get(item_id)||0) + qty);
    }
    for(const [item_id, qty] of counts.entries()) norm.push({ item_id, qty });
    if(norm.length===0) return badRequest('آیتم‌ها نامعتبر هستند');

    const ids = norm.map(x=>x.item_id);
    const placeholders = ids.map((_,i)=>`?${i+1}`).join(',');
    const items = await q(env, `SELECT id,category_id,name,price,is_available FROM items WHERE id IN (${placeholders})`, ids);
    const map = new Map(items.map(i=>[i.id,i]));

    for(const ln of norm){
      const it = map.get(ln.item_id);
      if(!it) return badRequest('یک آیتم یافت نشد');
      if(it.is_available!==1) return badRequest(`آیتم ناموجود است: ${it.name}`);
    }

    const discounts = await loadActiveDiscounts(env);

    // Build snapshot lines
    const snapshotLines = [];
    let subtotal = 0;
    let total = 0;

    for(const ln of norm){
      const it = map.get(ln.item_id);
      const pItem = discounts.item.get(it.id) || 0;
      const pCat = discounts.cat.get(it.category_id) || 0;
      const percent = Math.max(pItem, pCat);
      const { final_unit_price } = applyDiscount(it.price, percent);
      const lineSubtotal = it.price * ln.qty;
      const lineTotal = final_unit_price * ln.qty;
      subtotal += lineSubtotal;
      total += lineTotal;
      snapshotLines.push({
        item_id: it.id,
        name: it.name,
        qty: ln.qty,
        unit_price: it.price,
        discount_percent: percent,
        final_unit_price,
        line_total: lineTotal
      });
    }

    const discountAmount = subtotal - total;

    const receipt_code = await nextReceiptCode(env, table_no);

    // Insert order + items atomically
    const order = await tx(env, async ()=>{
      const ins = await env.DB.prepare(
        `INSERT INTO orders(receipt_code,table_no,status,customer_note,subtotal_amount,discount_amount,total_amount,created_at,updated_at)
         VALUES(?1,?2,?3,?4,?5,?6,?7,strftime('%s','now'),strftime('%s','now'))`
      ).bind(receipt_code, table_no, ORDER_STATUS.PENDING_WAITER, note, subtotal, discountAmount, total).run();

      const orderId = ins.meta?.last_row_id;
      for(const ln of snapshotLines){
        await env.DB.prepare(
          `INSERT INTO order_items(order_id,item_id,item_name_snapshot,qty,unit_price_snapshot,discount_percent_snapshot,final_unit_price_snapshot,line_total_snapshot)
           VALUES(?1,?2,?3,?4,?5,?6,?7,?8)`
        ).bind(orderId, ln.item_id, ln.name, ln.qty, ln.unit_price, ln.discount_percent, ln.final_unit_price, ln.line_total).run();
      }

      const created = await one(env, `SELECT receipt_code,table_no,status,customer_note,subtotal_amount,discount_amount,total_amount,created_at FROM orders WHERE id=?1`, [orderId]);
      return { ...created, lines: snapshotLines };
    });

    return json({ ok:true, order: {
      receipt_code: order.receipt_code,
      status: order.status,
      table_no: order.table_no,
      note: order.customer_note,
      totals: { subtotal: order.subtotal_amount, discount: order.discount_amount, total: order.total_amount },
      lines: order.lines,
      created_at: order.created_at
    }});
  }

  if(req.method==='GET' && params?.mode==='get'){
    const code = params.code;
    const ord = await one(env, `SELECT id,receipt_code,table_no,status,customer_note,subtotal_amount,discount_amount,total_amount,created_at,accepted_at,paid_at,reject_reason FROM orders WHERE receipt_code=?1`, [code]);
    if(!ord) return json({ ok:false, error:'سفارش پیدا نشد' }, 404);
    const lines = await q(env, `SELECT item_id,item_name_snapshot as name,qty,unit_price_snapshot as unit_price,discount_percent_snapshot as discount_percent,final_unit_price_snapshot as final_unit_price,line_total_snapshot as line_total FROM order_items WHERE order_id=?1 ORDER BY id ASC`, [ord.id]);
    return json({ ok:true, order:{
      receipt_code: ord.receipt_code,
      status: ord.status,
      table_no: ord.table_no,
      note: ord.customer_note || '',
      totals: { subtotal: ord.subtotal_amount, discount: ord.discount_amount, total: ord.total_amount },
      lines,
      created_at: ord.created_at,
      accepted_at: ord.accepted_at,
      paid_at: ord.paid_at,
      reject_reason: ord.reject_reason || ''
    }});
  }

  return badRequest('روش/مسیر نامعتبر');
}
