import { json, badRequest, unauthorized } from '../../response.js';
import { q, one, run } from '../../db.js';
import { requireAdmin } from '../../auth.js';

async function readJson(req){ try{ return await req.json(); }catch{ return null; } }

export async function apiAdminCategories(req, env, params){
  const s = await requireAdmin(req, env);
  if(!s.ok) return unauthorized();

  if(req.method==='GET'){
    const rows = await q(env, `SELECT id,name,sort_order,is_active FROM categories ORDER BY sort_order ASC, id ASC`);
    return json({ ok:true, categories: rows });
  }

  if(req.method==='POST'){
    const body = await readJson(req);
    if(!body) return badRequest('بدنه نامعتبر');
    const name = (body.name||'').toString().trim();
    const sort_order = parseInt(body.sort_order??0,10) || 0;
    if(name.length<1) return badRequest('نام لازم است');
    await run(env, `INSERT INTO categories(name,sort_order,is_active) VALUES(?1,?2,1)`, [name.slice(0,60), sort_order]);
    return json({ ok:true });
  }

  if(req.method==='PATCH' && params?.id){
    const id = parseInt(params.id,10);
    const cur = await one(env, `SELECT id,name,sort_order,is_active FROM categories WHERE id=?1`, [id]);
    if(!cur) return json({ ok:false, error:'Not found' }, 404);
    const body = await readJson(req);
    if(!body) return badRequest('بدنه نامعتبر');
    const name = body.name!=null ? (body.name||'').toString().trim().slice(0,60) : cur.name;
    const sort_order = body.sort_order!=null ? (parseInt(body.sort_order,10)||0) : cur.sort_order;
    const is_active = body.is_active!=null ? (body.is_active?1:0) : cur.is_active;
    await run(env, `UPDATE categories SET name=?1, sort_order=?2, is_active=?3 WHERE id=?4`, [name, sort_order, is_active, id]);
    return json({ ok:true });
  }

  if(req.method==='DELETE' && params?.id){
    const id = parseInt(params.id,10);
    await run(env, `DELETE FROM categories WHERE id=?1`, [id]);
    return json({ ok:true });
  }

  return badRequest('نامعتبر');
}

export async function apiAdminItems(req, env, params){
  const s = await requireAdmin(req, env);
  if(!s.ok) return unauthorized();

  if(req.method==='GET'){
    const rows = await q(env, `SELECT id,category_id,name,price,image_url,description,is_available,sort_order FROM items ORDER BY category_id ASC, sort_order ASC, id ASC`);
    return json({ ok:true, items: rows });
  }

  if(req.method==='POST'){
    const body = await readJson(req);
    if(!body) return badRequest('بدنه نامعتبر');
    const category_id = parseInt(body.category_id,10);
    const name = (body.name||'').toString().trim();
    const price = parseInt(body.price,10);
    const image_url = (body.image_url||'').toString().trim().slice(0,500);
    const description = (body.description||'').toString().trim().slice(0,200);
    const sort_order = parseInt(body.sort_order??0,10) || 0;
    if(!Number.isFinite(category_id) || category_id<=0) return badRequest('دسته نامعتبر');
    if(name.length<1) return badRequest('نام لازم است');
    if(!Number.isFinite(price) || price<0) return badRequest('قیمت نامعتبر');
    await run(env, `INSERT INTO items(category_id,name,price,image_url,description,is_available,sort_order) VALUES(?1,?2,?3,?4,?5,1,?6)`,
      [category_id, name.slice(0,80), price, image_url, description, sort_order]
    );
    return json({ ok:true });
  }

  if(req.method==='PATCH' && params?.id){
    const id = parseInt(params.id,10);
    const cur = await one(env, `SELECT * FROM items WHERE id=?1`, [id]);
    if(!cur) return json({ ok:false, error:'Not found' }, 404);
    const body = await readJson(req);
    if(!body) return badRequest('بدنه نامعتبر');

    const category_id = body.category_id!=null ? parseInt(body.category_id,10) : cur.category_id;
    const name = body.name!=null ? (body.name||'').toString().trim().slice(0,80) : cur.name;
    const price = body.price!=null ? parseInt(body.price,10) : cur.price;
    const image_url = body.image_url!=null ? (body.image_url||'').toString().trim().slice(0,500) : (cur.image_url||'');
    const description = body.description!=null ? (body.description||'').toString().trim().slice(0,200) : (cur.description||'');
    const is_available = body.is_available!=null ? (body.is_available?1:0) : cur.is_available;
    const sort_order = body.sort_order!=null ? (parseInt(body.sort_order,10)||0) : cur.sort_order;

    if(!Number.isFinite(category_id) || category_id<=0) return badRequest('دسته');
    if(!Number.isFinite(price) || price<0) return badRequest('قیمت');

    await run(env, `UPDATE items SET category_id=?1,name=?2,price=?3,image_url=?4,description=?5,is_available=?6,sort_order=?7 WHERE id=?8`,
      [category_id,name,price,image_url,description,is_available,sort_order,id]
    );
    return json({ ok:true });
  }

  if(req.method==='DELETE' && params?.id){
    const id = parseInt(params.id,10);
    await run(env, `DELETE FROM items WHERE id=?1`, [id]);
    return json({ ok:true });
  }

  return badRequest('نامعتبر');
}
