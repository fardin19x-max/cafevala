import { notFound } from './response.js';

export function makeRouter(){
  const routes = [];
  const add = (method, pattern, handler) => {
    const re = typeof pattern==='string' ? new RegExp('^'+pattern+'$') : pattern;
    routes.push({ method, re, handler });
  };

  const handle = async (req, env, ctx) => {
    const url = new URL(req.url);
    const path = url.pathname;
    for(const r of routes){
      if(r.method !== req.method && r.method !== '*') continue;
      const m = path.match(r.re);
      if(!m) continue;
      const params = m.groups || {};
      return r.handler(req, env, ctx, params);
    }
    return notFound();
  };

  return { add, handle };
}
