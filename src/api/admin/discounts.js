import { json, badRequest, unauthorized } from '../../response.js';
import { q, one, run } from '../../db.js';
import { requireAdmin } from '../../auth.js';

export async function apiAdminDiscounts(req, env, params){
  const s = await requireAdmin(req, env);
  if(!s.ok) return unauthorized();

  if(req.method==='GET'){
    const rows = await q(env, `SELECT id,scope,target_id,percent,is_active,starts_at,ends_at,created_at,updated_at FROM discount_rules ORDER BY id DESC LIMIT 500`);
    return json({ ok:true, rules: rows });
  }

  if(req.method==='POST'){
    let body=null; try{ body=await req.json(); }catch{}
    if(!body) return badRequest('بدنه نامعتبر');
    const scope = body.scope;
    const target_id = parseInt(body.target_id,10);
    const percent = parseInt(body.percent,10);
    const is_active = body.is_active===0 ? 0 : 1;
    const starts_at = body.starts_at==null ? null : parseInt(body.starts_at,10);
    const ends_at = body.ends_at==null ? null : parseInt(body.ends_at,10);

    if(scope!=='item' && scope!=='category') return badRequest('scope نامعتبر');
    if(!Number.isFinite(target_id) || target_id<=0) return badRequest('target_id نامعتبر');
    if(!Number.isFinite(percent) || percent<0 || percent>100) return badRequest('percent نامعتبر');

    await run(env, `
      INSERT INTO discount_rules(scope,target_id,percent,is_active,starts_at,ends_at,created_at,updated_at)
      VALUES(?1,?2,?3,?4,?5,?6,strftime('%s','now'),strftime('%s','now'))
      ON CONFLICT(scope,target_id) DO UPDATE SET
        percent=excluded.percent,
        is_active=excluded.is_active,
        starts_at=excluded.starts_at,
        ends_at=excluded.ends_at,
        updated_at=strftime('%s','now')
    `, [scope,target_id,percent,is_active,starts_at,ends_at]);

    return json({ ok:true });
  }

  if(req.method==='PATCH' && params?.id){
    const id = parseInt(params.id,10);
    if(!Number.isFinite(id)) return badRequest('id');
    let body=null; try{ body=await req.json(); }catch{}
    if(!body) return badRequest('بدنه نامعتبر');

    const cur = await one(env, `SELECT id,percent,is_active,starts_at,ends_at FROM discount_rules WHERE id=?1`, [id]);
    if(!cur) return json({ ok:false, error:'Not found' }, 404);

    let percent = cur.percent;
    let is_active = cur.is_active;
    let starts_at = cur.starts_at;
    let ends_at = cur.ends_at;

    if(body.percent!=null){
      const p = parseInt(body.percent,10);
      if(!Number.isFinite(p) || p<0 || p>100) return badRequest('percent');
      percent = p;
    }
    if(body.is_active!=null){
      is_active = body.is_active ? 1 : 0;
    }
    if(body.starts_at!==undefined){
      starts_at = body.starts_at==null ? null : parseInt(body.starts_at,10);
    }
    if(body.ends_at!==undefined){
      ends_at = body.ends_at==null ? null : parseInt(body.ends_at,10);
    }

    await run(env, `UPDATE discount_rules SET percent=?1,is_active=?2,starts_at=?3,ends_at=?4,updated_at=strftime('%s','now') WHERE id=?5`,
      [percent,is_active,starts_at,ends_at,id]
    );
    return json({ ok:true });
  }

  if(req.method==='DELETE' && params?.id){
    const id = parseInt(params.id,10);
    if(!Number.isFinite(id)) return badRequest('id');
    await run(env, `DELETE FROM discount_rules WHERE id=?1`, [id]);
    return json({ ok:true });
  }

  return badRequest('نامعتبر');
}
