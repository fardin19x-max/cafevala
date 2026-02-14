import { json } from '../../response.js';
import { q } from '../../db.js';
import { getSetting } from '../../settings.js';

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
  return { final_price: price - off, off };
}

export async function apiMenu(req, env){
  const shopOpen = await getSetting(env, 'shop_open', '1');
  const shopMsg = await getSetting(env, 'shop_message', '');

  const categories = await q(env, `SELECT id,name,sort_order FROM categories WHERE is_active=1 ORDER BY sort_order ASC, id ASC`);
  const itemsRaw = await q(env, `SELECT id,category_id,name,price,image_url,description,is_available,sort_order FROM items ORDER BY category_id ASC, sort_order ASC, id ASC`);

  const discounts = await loadActiveDiscounts(env);

  const items = itemsRaw.map(it=>{
    const pItem = discounts.item.get(it.id) || 0;
    const pCat = discounts.cat.get(it.category_id) || 0;
    const percent = Math.max(pItem, pCat);
    const { final_price } = applyDiscount(it.price, percent);
    return { ...it, discount_percent: percent, final_price };
  });

  const discounted = items.filter(x=>x.is_available===1 && x.discount_percent>0);

  const featuredRaw = await q(env, `
    SELECT i.id,i.category_id,i.name,i.price,i.image_url,i.description,i.is_available,fi.sort_order
    FROM featured_items fi
    JOIN items i ON i.id=fi.item_id
    WHERE fi.is_active=1
    ORDER BY fi.sort_order ASC, i.id ASC
  `);
  const featured = featuredRaw.map(it=>{
    const pItem = discounts.item.get(it.id) || 0;
    const pCat = discounts.cat.get(it.category_id) || 0;
    const percent = Math.max(pItem, pCat);
    const { final_price } = applyDiscount(it.price, percent);
    return { ...it, discount_percent: percent, final_price };
  }).filter(x=>x.is_available===1);

  return json({
    ok:true,
    shop: { open: Number(shopOpen)||0, message: shopMsg||'' },
    featured,
    discounted,
    categories,
    items
  });
}
