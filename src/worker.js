import { makeRouter } from './router.js';
import { html, json, redirect } from './response.js';

import { pageHome } from './pages/customer/home.js';
import { pageTable } from './pages/customer/table.js';
import { pageMenu } from './pages/customer/menu.js';
import { pageTrack } from './pages/customer/track.js';

import { pageAdminLogin } from './pages/admin/login.js';
import { pageAdminApp } from './pages/admin/app.js';

import { apiMenu } from './api/public/menu.js';
import { apiOrders } from './api/public/orders.js';
import { apiFeedback } from './api/public/feedback.js';

import { apiAdminLogin, apiAdminLogout, apiAdminMe } from './api/admin/auth.js';
import { apiAdminOrders } from './api/admin/orders.js';
import { apiAdminDiscounts } from './api/admin/discounts.js';
import { apiAdminFeatured } from './api/admin/featured.js';
import { apiAdminCategories, apiAdminItems } from './api/admin/menu.js';
import { apiAdminFeedback } from './api/admin/feedback.js';
import { apiAdminReports } from './api/admin/reports.js';
import { apiAdminSettings } from './api/admin/settings.js';

const router = makeRouter();

// Pages
router.add('GET', '/', async ()=> html(await pageHome()));
router.add('GET', '/table', async ()=> html(await pageTable()));
router.add('GET', '/menu', async ()=> html(await pageMenu()));
router.add('GET', '/track', async ()=> html(await pageTrack()));

router.add('GET', '/admin/login', async ()=> html(await pageAdminLogin()));
router.add('GET', '/admin', async ()=> html(await pageAdminApp()));

// Public APIs
router.add('GET', '/api/menu', async (req, env)=> apiMenu(req, env));
router.add('POST', '/api/orders', async (req, env)=> apiOrders(req, env, { mode:'create' }));
router.add('GET', /^\/api\/orders\/(?<code>[^\/]+)$/, async (req, env, ctx, p)=> apiOrders(req, env, { mode:'get', code: decodeURIComponent(p.code) }));
router.add('POST', '/api/feedback', async (req, env)=> apiFeedback(req, env));

// Admin APIs
router.add('POST', '/api/admin/login', async (req, env)=> apiAdminLogin(req, env));
router.add('POST', '/api/admin/logout', async (req, env)=> apiAdminLogout(req, env));
router.add('GET', '/api/admin/me', async (req, env)=> apiAdminMe(req, env));

router.add('GET', '/api/admin/orders', async (req, env)=> apiAdminOrders(req, env, { mode:'list' }));
router.add('GET', /^\/api\/admin\/orders\/(?<code>[^\/]+)$/, async (req, env, ctx, p)=> apiAdminOrders(req, env, { mode:'details', code: decodeURIComponent(p.code) }));
router.add('PATCH', /^\/api\/admin\/orders\/(?<code>[^\/]+)\/accept$/, async (req, env, ctx, p)=> apiAdminOrders(req, env, { mode:'accept', code: decodeURIComponent(p.code) }));
router.add('PATCH', /^\/api\/admin\/orders\/(?<code>[^\/]+)\/reject$/, async (req, env, ctx, p)=> apiAdminOrders(req, env, { mode:'reject', code: decodeURIComponent(p.code) }));
router.add('PATCH', /^\/api\/admin\/orders\/(?<code>[^\/]+)\/pay$/, async (req, env, ctx, p)=> apiAdminOrders(req, env, { mode:'pay', code: decodeURIComponent(p.code) }));

router.add('GET', '/api/admin/discounts', async (req, env)=> apiAdminDiscounts(req, env));
router.add('POST', '/api/admin/discounts', async (req, env)=> apiAdminDiscounts(req, env));
router.add('PATCH', /^\/api\/admin\/discounts\/(?<id>\d+)$/, async (req, env, ctx, p)=> apiAdminDiscounts(req, env, { id: p.id }));
router.add('DELETE', /^\/api\/admin\/discounts\/(?<id>\d+)$/, async (req, env, ctx, p)=> apiAdminDiscounts(req, env, { id: p.id }));

router.add('GET', '/api/admin/featured', async (req, env)=> apiAdminFeatured(req, env));
router.add('PUT', '/api/admin/featured', async (req, env)=> apiAdminFeatured(req, env));

router.add('GET', '/api/admin/categories', async (req, env)=> apiAdminCategories(req, env));
router.add('POST', '/api/admin/categories', async (req, env)=> apiAdminCategories(req, env));
router.add('PATCH', /^\/api\/admin\/categories\/(?<id>\d+)$/, async (req, env, ctx, p)=> apiAdminCategories(req, env, { id: p.id }));
router.add('DELETE', /^\/api\/admin\/categories\/(?<id>\d+)$/, async (req, env, ctx, p)=> apiAdminCategories(req, env, { id: p.id }));

router.add('GET', '/api/admin/items', async (req, env)=> apiAdminItems(req, env));
router.add('POST', '/api/admin/items', async (req, env)=> apiAdminItems(req, env));
router.add('PATCH', /^\/api\/admin\/items\/(?<id>\d+)$/, async (req, env, ctx, p)=> apiAdminItems(req, env, { id: p.id }));
router.add('DELETE', /^\/api\/admin\/items\/(?<id>\d+)$/, async (req, env, ctx, p)=> apiAdminItems(req, env, { id: p.id }));

router.add('GET', '/api/admin/feedback', async (req, env)=> apiAdminFeedback(req, env));
router.add('PATCH', /^\/api\/admin\/feedback\/(?<id>\d+)\/read$/, async (req, env, ctx, p)=> apiAdminFeedback(req, env, { id: p.id }));

router.add('GET', '/api/admin/reports/daily', async (req, env)=> apiAdminReports(req, env));
router.add('GET', '/api/admin/settings', async (req, env)=> apiAdminSettings(req, env));
router.add('PATCH', '/api/admin/settings', async (req, env)=> apiAdminSettings(req, env));

export default {
  async fetch(req, env, ctx){
    try{
      return await router.handle(req, env, ctx);
    }catch(e){
      return json({ ok:false, error: e?.message || String(e) }, 500);
    }
  }
};
