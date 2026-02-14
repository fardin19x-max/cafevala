import { parseCookies, setCookie } from './response.js';

function b64u(bytes){
  let str = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return str.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function ub64u(s){
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4) s+='=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}

async function hmac(secret, data){
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name:'HMAC', hash:'SHA-256' }, false, ['sign','verify']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64u(sig);
}

export async function createSessionCookie(env, username){
  const exp = Math.floor(Date.now()/1000) + 60*60*12; // 12h
  const payload = b64u(new TextEncoder().encode(JSON.stringify({ u: username, exp })));
  const sig = await hmac(env.SECRET, payload);
  const token = `${payload}.${sig}`;
  return setCookie('sess', token, { maxAge: 60*60*12 });
}

export async function clearSessionCookie(){
  return setCookie('sess','', { maxAge: 0 });
}

export async function requireAdmin(req, env){
  const cookies = parseCookies(req);
  const token = cookies.sess;
  if(!token) return { ok:false };
  const parts = token.split('.');
  if(parts.length!==2) return { ok:false };
  const [payload, sig] = parts;
  const expected = await hmac(env.SECRET, payload);
  if(expected !== sig) return { ok:false };
  let data;
  try{
    data = JSON.parse(new TextDecoder().decode(ub64u(payload)));
  }catch{ return { ok:false }; }
  if(!data?.u || !data?.exp) return { ok:false };
  if(data.exp < Math.floor(Date.now()/1000)) return { ok:false };
  return { ok:true, username: data.u };
}
