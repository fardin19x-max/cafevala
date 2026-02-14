import { json, badRequest, unauthorized } from '../../response.js';
import { getSettingsMap, setSetting } from '../../settings.js';
import { requireAdmin } from '../../auth.js';

export async function apiAdminSettings(req, env){
  const s = await requireAdmin(req, env);
  if(!s.ok) return unauthorized();

  if(req.method==='GET'){
    const m = await getSettingsMap(env);
    return json({ ok:true, settings: m });
  }

  if(req.method==='PATCH'){
    let body=null; try{ body=await req.json(); }catch{}
    if(!body || typeof body!=='object') return badRequest('بدنه نامعتبر');
    const allowed = new Set(['shop_open','shop_message','theme_bg','theme_card','theme_line','theme_mint','receipt_prefix']);
    for(const [k,v] of Object.entries(body)){
      if(!allowed.has(k)) continue;
      await setSetting(env, k, String(v));
    }
    return json({ ok:true });
  }

  return badRequest('نامعتبر');
}
