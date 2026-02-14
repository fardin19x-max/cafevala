import { json, badRequest } from '../../response.js';
import { run } from '../../db.js';

async function readJson(req){
  try{ return await req.json(); }catch{ return null; }
}

export async function apiFeedback(req, env){
  if(req.method!=='POST') return badRequest('روش نامعتبر');
  const body = await readJson(req);
  if(!body) return badRequest('بدنه نامعتبر');
  const table_no = body.table_no ? parseInt(body.table_no,10) : null;
  const message = (body.message||'').toString().trim();
  if(message.length<2) return badRequest('پیام کوتاه است');
  await run(env, `INSERT INTO feedback(table_no,message,is_read,created_at) VALUES(?1,?2,0,strftime('%s','now'))`, [table_no||null, message.slice(0,1000)]);
  return json({ ok:true });
}
