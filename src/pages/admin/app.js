import { layout } from '../ui/layout.js';

export async function pageAdminApp(){
  const body = `
  <div class="container">
    <div class="topbar">
      <div class="brand">VALA <span class="badge">پنل مدیریت</span></div>
      <div class="row" style="gap:8px;align-items:center">
        <span id="me" class="badge">...</span>
        <button class="btn" id="logout">خروج</button>
      </div>
    </div>

    <div class="tabs" id="tabs">
      <div class="tab active" data-tab="waiter">گارسون</div>
      <div class="tab" data-tab="cashier">صندوق</div>
      <div class="tab" data-tab="featured">پیشنهاد روز</div>
      <div class="tab" data-tab="discounts">تخفیف‌ها</div>
      <div class="tab" data-tab="menu">منو</div>
      <div class="tab" data-tab="messages">پیام‌ها</div>
      <div class="tab" data-tab="reports">گزارش</div>
      <div class="tab" data-tab="settings">تنظیمات</div>
    </div>

    <div id="panel"></div>
  </div>`;

  const script = `
    async function mustAuth(){
      try{
        const me = await api('/api/admin/me');
        $('#me').textContent = me.username;
      }catch{ location.href='/admin/login'; }
    }
    mustAuth();

    $('#logout').addEventListener('click', async ()=>{
      try{ await api('/api/admin/logout', { method:'POST' }); }catch{}
      location.href='/admin/login';
    });

    function setActive(tab){
      $$('#tabs .tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
    }

    async function renderWaiter(){
      const j = await api('/api/admin/orders?status=pending_waiter');
      const cards = (j.orders||[]).map(o=>{
        return `<div class="card" style="margin-top:10px">
          <div class="row" style="justify-content:space-between;align-items:center">
            <div>
              <b>${o.receipt_code}</b> <span class="small">میز ${o.table_no}</span>
              <div class="small">${new Date(o.created_at*1000).toLocaleString('fa-IR')}</div>
            </div>
            <div class="badge">${money(o.total_amount)} تومان</div>
          </div>
          <div style="height:10px"></div>
          <div class="row">
            <button class="btn" data-det="${o.receipt_code}">جزئیات</button>
            <button class="btn danger" data-rej="${o.receipt_code}">رد</button>
            <button class="btn primary" data-acc="${o.receipt_code}">تایید</button>
          </div>
          <div id="det-${o.receipt_code}" style="margin-top:10px;display:none"></div>
        </div>`;
      }).join('') || `<div class="card"><p class="small">سفارش جدید نیست</p></div>`;

      $('#panel').innerHTML = `<div class="card">
        <div class="h1" style="font-size:18px">سفارش‌های منتظر تایید</div>
        <p class="p">با تایید، سفارش به صندوق ارسال می‌شود.</p>
      </div>${cards}`;

      // bind
      $$('[data-acc]').forEach(b=>b.addEventListener('click', async ()=>{
        try{ await api('/api/admin/orders/'+encodeURIComponent(b.dataset.acc)+'/accept', { method:'PATCH' }); toast('تایید شد'); renderWaiter(); }
        catch(e){ toast(e.message); }
      }));
      $$('[data-rej]').forEach(b=>b.addEventListener('click', async ()=>{
        const reason = prompt('دلیل رد؟ (اختیاری)') || '';
        try{ await api('/api/admin/orders/'+encodeURIComponent(b.dataset.rej)+'/reject', { method:'PATCH', body: JSON.stringify({ reason }) }); toast('رد شد'); renderWaiter(); }
        catch(e){ toast(e.message); }
      }));
      $$('[data-det]').forEach(b=>b.addEventListener('click', async ()=>{
        const code = b.dataset.det;
        const box = $('#det-'+code);
        if(box.style.display==='block'){ box.style.display='none'; return; }
        try{
          const d = await api('/api/admin/orders/'+encodeURIComponent(code));
          const rows = (d.order.lines||[]).map(l=>`<tr><td>${l.name}</td><td>${l.qty}</td><td>${money(l.line_total)}</td></tr>`).join('');
          box.innerHTML = `<table class="table"><thead><tr><th>آیتم</th><th>تعداد</th><th>جمع</th></tr></thead><tbody>${rows}</tbody></table>`;
          box.style.display='block';
        }catch(e){ toast(e.message); }
      }));
    }

    async function renderCashier(){
      const j = await api('/api/admin/orders?status=accepted_waiter');
      const cards = (j.orders||[]).map(o=>{
        return `<div class="card" style="margin-top:10px">
          <div class="row" style="justify-content:space-between;align-items:center">
            <div>
              <b>${o.receipt_code}</b> <span class="small">میز ${o.table_no}</span>
              <div class="small">تایید: ${o.accepted_at?new Date(o.accepted_at*1000).toLocaleString('fa-IR'):''}</div>
            </div>
            <div class="badge">${money(o.total_amount)} تومان</div>
          </div>
          <div style="height:10px"></div>
          <div class="row">
            <button class="btn" data-det2="${o.receipt_code}">جزئیات</button>
            <button class="btn primary" data-pay="${o.receipt_code}">پرداخت شد (نقدی)</button>
          </div>
          <div id="det2-${o.receipt_code}" style="margin-top:10px;display:none"></div>
        </div>`;
      }).join('') || `<div class="card"><p class="small">فعلاً سفارشی برای صندوق نیست</p></div>`;

      $('#panel').innerHTML = `<div class="card">
        <div class="h1" style="font-size:18px">صندوق (پرداخت نقدی)</div>
        <p class="p">اینجا فقط سفارش‌های تاییدشده گارسون نمایش داده می‌شوند.</p>
      </div>${cards}`;

      $$('[data-pay]').forEach(b=>b.addEventListener('click', async ()=>{
        if(!confirm('پرداخت تایید شود؟')) return;
        try{ await api('/api/admin/orders/'+encodeURIComponent(b.dataset.pay)+'/pay', { method:'PATCH' }); toast('ثبت شد'); renderCashier(); }
        catch(e){ toast(e.message); }
      }));
      $$('[data-det2]').forEach(b=>b.addEventListener('click', async ()=>{
        const code = b.dataset.det2;
        const box = $('#det2-'+code);
        if(box.style.display==='block'){ box.style.display='none'; return; }
        try{
          const d = await api('/api/admin/orders/'+encodeURIComponent(code));
          const rows = (d.order.lines||[]).map(l=>`<tr><td>${l.name}</td><td>${l.qty}</td><td>${money(l.line_total)}</td></tr>`).join('');
          box.innerHTML = `<table class="table"><thead><tr><th>آیتم</th><th>تعداد</th><th>جمع</th></tr></thead><tbody>${rows}</tbody></table>`;
          box.style.display='block';
        }catch(e){ toast(e.message); }
      }));
    }

    async function renderFeatured(){
      const items = await api('/api/admin/items');
      const feat = await api('/api/admin/featured');
      const selected = new Set((feat.items||[]).filter(x=>x.is_active===1).map(x=>x.item_id));

      const opts = (items.items||[]).map(i=>`<label style="display:flex;gap:10px;align-items:center;padding:8px;border-bottom:1px solid var(--line)">
        <input type="checkbox" data-fi="${i.id}" ${selected.has(i.id)?'checked':''} />
        <span style="flex:1">${i.name}</span>
        <span class="small">${money(i.price)}</span>
      </label>`).join('');

      $('#panel').innerHTML = `<div class="card">
        <div class="h1" style="font-size:18px">پیشنهاد روز</div>
        <p class="p">چند آیتم رو انتخاب کن (نمایش در ابتدای منوی مشتری)</p>
        <div style="height:10px"></div>
        <div class="card" style="padding:0;max-height:420px;overflow:auto">${opts || '<p class="small" style="padding:12px">آیتمی نیست</p>'}</div>
        <div style="height:10px"></div>
        <button class="btn primary" id="saveFeat">ذخیره</button>
      </div>`;

      $('#saveFeat').addEventListener('click', async ()=>{
        const checked = $$('[data-fi]')
          .filter(x=>x.checked)
          .map((x,idx)=>({ item_id: parseInt(x.dataset.fi,10), sort_order: idx+1, is_active: 1 }));
        try{
          await api('/api/admin/featured', { method:'PUT', body: JSON.stringify({ items: checked }) });
          toast('ذخیره شد');
        }catch(e){ toast(e.message); }
      });
    }

    async function renderDiscounts(){
      const rules = await api('/api/admin/discounts');
      const cats = await api('/api/admin/categories');
      const items = await api('/api/admin/items');

      function ruleRow(r){
        const name = r.scope==='category'
          ? 'دسته: ' + (cats.categories.find(c=>c.id===r.target_id)?.name || r.target_id)
          : 'آیتم: ' + (items.items.find(i=>i.id===r.target_id)?.name || r.target_id);
        return `<tr>
          <td>${name}</td>
          <td>${r.percent}%</td>
          <td>${r.is_active? 'فعال':'خاموش'}</td>
          <td>
            <button class="btn" data-toggle="${r.id}">${r.is_active? 'خاموش':'فعال'}</button>
            <button class="btn" data-edit="${r.id}">ویرایش</button>
            <button class="btn danger" data-del="${r.id}">حذف</button>
          </td>
        </tr>`;
      }

      $('#panel').innerHTML = `<div class="grid">
        <div class="col-12 card">
          <div class="h1" style="font-size:18px">تخفیف‌ها</div>
          <p class="p">تخفیف روی آیتم یا دسته. (در سفارش Snapshot می‌شود.)</p>
        </div>

        <div class="col-6 card">
          <b>ایجاد/ویرایش تخفیف آیتم</b>
          <div style="height:8px"></div>
          <select class="input" id="dItem">
            ${(items.items||[]).map(i=>`<option value="${i.id}">${i.name}</option>`).join('')}
          </select>
          <div style="height:8px"></div>
          <input class="input" id="dItemP" inputmode="numeric" placeholder="درصد (مثلاً 20)" />
          <div style="height:8px"></div>
          <button class="btn primary" id="saveItemD">ذخیره</button>
        </div>

        <div class="col-6 card">
          <b>ایجاد/ویرایش تخفیف دسته</b>
          <div style="height:8px"></div>
          <select class="input" id="dCat">
            ${(cats.categories||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
          <div style="height:8px"></div>
          <input class="input" id="dCatP" inputmode="numeric" placeholder="درصد (مثلاً 10)" />
          <div style="height:8px"></div>
          <button class="btn primary" id="saveCatD">ذخیره</button>
        </div>

        <div class="col-12 card">
          <b>قوانین فعلی</b>
          <div style="height:10px"></div>
          <table class="table"><thead><tr><th>هدف</th><th>درصد</th><th>وضعیت</th><th>عملیات</th></tr></thead>
          <tbody>${(rules.rules||[]).map(ruleRow).join('') || `<tr><td colspan="4" class="small">قانونی نیست</td></tr>`}</tbody></table>
        </div>
      </div>`;

      async function upsert(scope, target_id, percent){
        await api('/api/admin/discounts', { method:'POST', body: JSON.stringify({ scope, target_id, percent, is_active: 1 }) });
      }

      $('#saveItemD').addEventListener('click', async ()=>{
        const target_id = parseInt($('#dItem').value,10);
        const percent = parseInt($('#dItemP').value,10);
        if(!Number.isFinite(percent)) return toast('درصد');
        try{ await upsert('item', target_id, percent); toast('ذخیره شد'); renderDiscounts(); }catch(e){ toast(e.message); }
      });

      $('#saveCatD').addEventListener('click', async ()=>{
        const target_id = parseInt($('#dCat').value,10);
        const percent = parseInt($('#dCatP').value,10);
        if(!Number.isFinite(percent)) return toast('درصد');
        try{ await upsert('category', target_id, percent); toast('ذخیره شد'); renderDiscounts(); }catch(e){ toast(e.message); }
      });

      $$('[data-toggle]').forEach(b=>b.addEventListener('click', async ()=>{
        const id = parseInt(b.dataset.toggle,10);
        const r = (rules.rules||[]).find(x=>x.id===id);
        try{ await api('/api/admin/discounts/'+id, { method:'PATCH', body: JSON.stringify({ is_active: r.is_active?0:1 }) }); toast('انجام شد'); renderDiscounts(); }
        catch(e){ toast(e.message); }
      }));
      $$('[data-edit]').forEach(b=>b.addEventListener('click', async ()=>{
        const id = parseInt(b.dataset.edit,10);
        const r = (rules.rules||[]).find(x=>x.id===id);
        const p = parseInt(prompt('درصد جدید؟', String(r.percent))||'','' ,10);
        if(!Number.isFinite(p)) return;
        try{ await api('/api/admin/discounts/'+id, { method:'PATCH', body: JSON.stringify({ percent: p }) }); toast('ویرایش شد'); renderDiscounts(); }
        catch(e){ toast(e.message); }
      }));
      $$('[data-del]').forEach(b=>b.addEventListener('click', async ()=>{
        const id = parseInt(b.dataset.del,10);
        if(!confirm('حذف شود؟')) return;
        try{ await api('/api/admin/discounts/'+id, { method:'DELETE' }); toast('حذف شد'); renderDiscounts(); }
        catch(e){ toast(e.message); }
      }));
    }

    async function renderMenu(){
      const cats = await api('/api/admin/categories');
      const items = await api('/api/admin/items');

      const catRows = (cats.categories||[]).map(c=>`<tr>
        <td>${c.id}</td><td>${c.name}</td><td>${c.sort_order}</td><td>${c.is_active? 'فعال':'خاموش'}</td>
        <td>
          <button class="btn" data-ce="${c.id}">ویرایش</button>
          <button class="btn danger" data-cd="${c.id}">حذف</button>
        </td>
      </tr>`).join('');

      const itemRows = (items.items||[]).map(i=>`<tr>
        <td>${i.id}</td><td>${i.name}</td><td class="small">${cats.categories.find(c=>c.id===i.category_id)?.name||i.category_id}</td>
        <td>${money(i.price)}</td><td>${i.is_available? 'موجود':'ناموجود'}</td>
        <td>
          <button class="btn" data-ie="${i.id}">ویرایش</button>
          <button class="btn" data-it="${i.id}">${i.is_available? 'ناموجود':'موجود'}</button>
          <button class="btn danger" data-idel="${i.id}">حذف</button>
        </td>
      </tr>`).join('');

      $('#panel').innerHTML = `<div class="grid">
        <div class="col-6 card">
          <b>افزودن دسته</b>
          <div style="height:8px"></div>
          <input class="input" id="cn" placeholder="نام دسته" />
          <div style="height:8px"></div>
          <button class="btn primary" id="addCat">افزودن</button>
          <div style="height:12px"></div>
          <table class="table"><thead><tr><th>ID</th><th>نام</th><th>ترتیب</th><th>وضعیت</th><th></th></tr></thead><tbody>${catRows || `<tr><td colspan="5" class="small">ندارد</td></tr>`}</tbody></table>
        </div>

        <div class="col-6 card">
          <b>افزودن آیتم</b>
          <div style="height:8px"></div>
          <select class="input" id="ic">
            ${(cats.categories||[]).map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
          <div style="height:8px"></div>
          <input class="input" id="in" placeholder="نام آیتم" />
          <div style="height:8px"></div>
          <input class="input" id="ip" inputmode="numeric" placeholder="قیمت (تومان)" />
          <div style="height:8px"></div>
          <button class="btn primary" id="addItem">افزودن</button>
          <div style="height:12px"></div>
          <div style="max-height:360px;overflow:auto">
            <table class="table"><thead><tr><th>ID</th><th>نام</th><th>دسته</th><th>قیمت</th><th>وضعیت</th><th></th></tr></thead><tbody>${itemRows || `<tr><td colspan="6" class="small">ندارد</td></tr>`}</tbody></table>
          </div>
        </div>
      </div>`;

      $('#addCat').addEventListener('click', async ()=>{
        const name = ($('#cn').value||'').trim();
        if(!name) return toast('نام');
        try{ await api('/api/admin/categories', { method:'POST', body: JSON.stringify({ name }) }); toast('اضافه شد'); renderMenu(); }
        catch(e){ toast(e.message); }
      });
      $('#addItem').addEventListener('click', async ()=>{
        const category_id = parseInt($('#ic').value,10);
        const name = ($('#in').value||'').trim();
        const price = parseInt($('#ip').value,10);
        if(!name || !Number.isFinite(price)) return toast('اطلاعات');
        try{ await api('/api/admin/items', { method:'POST', body: JSON.stringify({ category_id, name, price }) }); toast('اضافه شد'); renderMenu(); }
        catch(e){ toast(e.message); }
      });

      $$('[data-cd]').forEach(b=>b.addEventListener('click', async ()=>{
        if(!confirm('حذف دسته؟ (آیتم‌های داخلش هم حذف میشن)')) return;
        try{ await api('/api/admin/categories/'+b.dataset.cd, { method:'DELETE' }); toast('حذف شد'); renderMenu(); }
        catch(e){ toast(e.message); }
      }));
      $$('[data-ce]').forEach(b=>b.addEventListener('click', async ()=>{
        const id = parseInt(b.dataset.ce,10);
        const c = cats.categories.find(x=>x.id===id);
        const name = prompt('نام جدید', c.name);
        if(name==null) return;
        try{ await api('/api/admin/categories/'+id, { method:'PATCH', body: JSON.stringify({ name }) }); toast('ویرایش شد'); renderMenu(); }
        catch(e){ toast(e.message); }
      }));

      $$('[data-idel]').forEach(b=>b.addEventListener('click', async ()=>{
        if(!confirm('حذف آیتم؟')) return;
        try{ await api('/api/admin/items/'+b.dataset.idel, { method:'DELETE' }); toast('حذف شد'); renderMenu(); }
        catch(e){ toast(e.message); }
      }));
      $$('[data-it]').forEach(b=>b.addEventListener('click', async ()=>{
        const id = parseInt(b.dataset.it,10);
        const it = items.items.find(x=>x.id===id);
        try{ await api('/api/admin/items/'+id, { method:'PATCH', body: JSON.stringify({ is_available: it.is_available?0:1 }) }); toast('انجام شد'); renderMenu(); }
        catch(e){ toast(e.message); }
      }));
      $$('[data-ie]').forEach(b=>b.addEventListener('click', async ()=>{
        const id = parseInt(b.dataset.ie,10);
        const it = items.items.find(x=>x.id===id);
        const name = prompt('نام', it.name);
        if(name==null) return;
        const price = parseInt(prompt('قیمت', String(it.price))||'',10);
        if(!Number.isFinite(price)) return;
        try{ await api('/api/admin/items/'+id, { method:'PATCH', body: JSON.stringify({ name, price }) }); toast('ویرایش شد'); renderMenu(); }
        catch(e){ toast(e.message); }
      }));
    }

    async function renderMessages(){
      const j = await api('/api/admin/feedback?unread=0');
      const rows = (j.messages||[]).map(m=>`<tr>
        <td>${m.id}</td><td>${m.table_no||'-'}</td><td>${m.message}</td><td>${m.is_read? 'خوانده شده':'جدید'}</td>
        <td><button class="btn" data-read="${m.id}">خواندم</button></td>
      </tr>`).join('') || `<tr><td colspan="5" class="small">پیامی نیست</td></tr>`;

      $('#panel').innerHTML = `<div class="card">
        <div class="h1" style="font-size:18px">پیام‌های مشتری</div>
        <div style="height:10px"></div>
        <table class="table"><thead><tr><th>ID</th><th>میز</th><th>پیام</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;

      $$('[data-read]').forEach(b=>b.addEventListener('click', async ()=>{
        try{ await api('/api/admin/feedback/'+b.dataset.read+'/read', { method:'PATCH' }); toast('ثبت شد'); renderMessages(); }
        catch(e){ toast(e.message); }
      }));
    }

    async function renderReports(){
      const j = await api('/api/admin/reports/daily');
      const rows = (j.orders||[]).map(o=>`<tr><td>${o.receipt_code}</td><td>${o.table_no}</td><td>${money(o.total_amount)}</td><td>${new Date(o.paid_at*1000).toLocaleString('fa-IR')}</td></tr>`).join('') || `<tr><td colspan="4" class="small">پرداختی نیست</td></tr>`;
      $('#panel').innerHTML = `<div class="card">
        <div class="h1" style="font-size:18px">گزارش امروز</div>
        <div class="row" style="justify-content:space-between;align-items:center">
          <div class="badge">تعداد: ${(j.summary?.count||0)}</div>
          <div class="badge">جمع: ${money(j.summary?.total||0)} تومان</div>
        </div>
        <div style="height:10px"></div>
        <table class="table"><thead><tr><th>کد</th><th>میز</th><th>مبلغ</th><th>زمان</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
    }

    async function renderSettings(){
      const j = await api('/api/admin/settings');
      const s = j.settings||{};
      $('#panel').innerHTML = `<div class="grid">
        <div class="col-12 card">
          <div class="h1" style="font-size:18px">تنظیمات</div>
          <div class="row" style="align-items:center;justify-content:space-between">
            <div>
              <b>سفارش‌گیری</b>
              <div class="small">باز/بسته + پیام</div>
            </div>
            <label class="badge"><input type="checkbox" id="open" ${String(s.shop_open||'1')==='1'?'checked':''}/> باز</label>
          </div>
          <div style="height:10px"></div>
          <input class="input" id="msg" placeholder="پیام وقتی بسته است" value="${(s.shop_message||'').replace(/"/g,'&quot;')}" />
          <div style="height:12px"></div>
          <button class="btn primary" id="saveS">ذخیره</button>
        </div>
      </div>`;

      $('#saveS').addEventListener('click', async ()=>{
        try{
          await api('/api/admin/settings', { method:'PATCH', body: JSON.stringify({
            shop_open: $('#open').checked ? '1':'0',
            shop_message: ($('#msg').value||'')
          }) });
          toast('ذخیره شد');
        }catch(e){ toast(e.message); }
      });
    }

    const renderers = {
      waiter: renderWaiter,
      cashier: renderCashier,
      featured: renderFeatured,
      discounts: renderDiscounts,
      menu: renderMenu,
      messages: renderMessages,
      reports: renderReports,
      settings: renderSettings
    };

    async function go(tab){
      setActive(tab);
      $('#panel').innerHTML = `<div class="card"><p class="small">در حال بارگذاری...</p></div>`;
      try{ await renderers[tab](); }
      catch(e){ toast(e.message); }
    }

    $$('#tabs .tab').forEach(t=>t.addEventListener('click', ()=>go(t.dataset.tab)));
    go('waiter');

    // auto refresh for waiter & cashier
    setInterval(()=>{
      const active = $('#tabs .tab.active')?.dataset.tab;
      if(active==='waiter') renderWaiter().catch(()=>{});
      if(active==='cashier') renderCashier().catch(()=>{});
    }, 2000);
  `;

  return layout({ title:'Admin', body, script });
}
