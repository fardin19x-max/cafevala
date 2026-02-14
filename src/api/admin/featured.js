import { json, badRequest, unauthorized } from '../../response.js';
import { q, run, tx } from '../../db.js';
import { requireAdmin } from '../../auth.js';

export async function apiAdminFeatured(req, env){
  const s = await requireAdmin(req, env);
  if(!s.ok) return unauthorized();

  if(req.method==='GET'){
    const rows = await q(env, `
      SELECT fi.item_id, fi.sort_order, fi.is_active, i.name, i.price
      FROM featured_items fi
      JOIN items i ON i.id=fi.item_id
      ORDER BY fi.sort_order ASC, fi.item_id ASC
    `);
    return json({ ok:true, items: rows });
  }

  if(req.method==='PUT'){
    let body=null; try{ body=await req.json(); }catch{}
    if(!body || !Array.isArray(body.items)) return badRequest('بدنه نامعتبر');

    const items = body.items
      .map(x=>({ item_id: parseInt(x.item_id,10), sort_order: parseInt(x.sort_order??0,10), is_active: x.is_active===0?0:1 }))
      .filter(x=>Number.isFinite(x.item_id) && x.item_id>0);

    await tx(env, async ()=>{
      await run(env, `DELETE FROM featured_items`);
      for(const it of items){
        await run(env, `INSERT INTO featured_items(item_id,sort_order,is_active) VALUES(?1,?2,?3)`, [it.item_id, it.sort_order||0, it.is_active]);
      }
    });

    return json({ ok:true });
  }

  return badRequest('نامعتبر');
}
