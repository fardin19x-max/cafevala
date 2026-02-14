import { layout } from '../ui/layout.js';

export async function pageMenu(){
  const body = `
  <div class="container">
    <div class="topbar">
      <div class="brand">VALA <span class="badge">منو</span></div>
      <div class="row" style="gap:8px;align-items:center">
        <div id="tableBadge" class="badge"></div>
        <a class="badge" href="/">خانه</a>
      </div>
    </div>

    <div class="tabs" id="topTabs">
      <div class="tab active" data-go="#sec-featured">پیشنهاد روز</div>
      <div class="tab" data-go="#sec-discount">تخفیف روز</div>
      <div class="tab" data-go="#sec-menu">منو کامل</div>
      <div class="tab" data-go="#sec-feedback">پیام</div>
    </div>

    <div id="shopClosed" class="card" style="display:none;border-color:rgba(255,207,90,.45);background:rgba(255,207,90,.08)"></div>

    <section id="sec-featured" class="card" style="margin-top:12px">
      <div class="h1" style="font-size:18px">پیشنهاد روز</div>
      <div id="featured"></div>
    </section>

    <section id="sec-discount" class="card" style="margin-top:12px">
      <div class="h1" style="font-size:18px">تخفیف روز</div>
      <div id="discounted"></div>
    </section>

    <section id="sec-menu" class="card" style="margin-top:12px">
      <div class="h1" style="font-size:18px">منو کامل</div>
      <div style="height:8px"></div>
      <input class="input" id="search" placeholder="جستجو..." />
      <div style="height:10px"></div>
      <div class="chips" id="cats"></div>
      <div style="height:10px"></div>
      <div id="items"></div>
    </section>

    <section id="sec-feedback" class="card" style="margin-top:12px">
      <div class="h1" style="font-size:18px">پیام به مدیریت</div>
      <p class="p">مثلاً: «لطفاً نوشیدنی X رو اضافه کنید» یا نظر/انتقاد</p>
      <div style="height:10px"></div>
      <textarea class="input" id="msg" rows="4" placeholder="پیام شما..."></textarea>
      <div style="height:10px"></div>
      <button class="btn primary" id="sendMsg">ارسال پیام</button>
    </section>

    <section id="invoiceBox" style="margin-top:12px;display:none"></section>

  </div>

  <div class="bottomBar">
    <div class="bottomInner">
      <div>
        <div style="font-weight:900" id="sum">۰</div>
        <div class="small" id="cnt">۰ آیتم</div>
      </div>
      <div class="row" style="gap:8px">
        <button class="btn" id="viewCart">سبد</button>
        <button class="btn primary" id="submit">ثبت سفارش</button>
      </div>
    </div>
  </div>`;

  const script = `
    const tableNo = localStorage.getItem('table_no');
    if(!tableNo){ location.href='/table'; }
    $('#tableBadge').textContent = 'میز: ' + tableNo;

    // tabs scroll
    $$('#topTabs .tab').forEach(t=>t.addEventListener('click', ()=>{
      $$('#topTabs .tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const sel = t.getAttribute('data-go');
      const el = document.querySelector(sel);
      if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    }));

    let DATA=null;

    // cart
    const cart = (()=>{
      try{ return JSON.parse(localStorage.getItem('cart')||'{}'); }catch{ return {}; }
    })();
    function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }

    function add(itemId){
      cart[itemId] = (cart[itemId]||0) + 1;
      saveCart();
      renderBottom();
      toast('اضافه شد');
    }
    function sub(itemId){
      cart[itemId] = (cart[itemId]||0) - 1;
      if(cart[itemId]<=0) delete cart[itemId];
      saveCart();
      renderBottom();
    }

    function cartLines(){
      const itemsMap = new Map((DATA?.items||[]).map(i=>[i.id,i]));
      const lines=[];
      for(const [k,v] of Object.entries(cart)){
        const id = parseInt(k,10);
        const qty = parseInt(v,10);
        const it = itemsMap.get(id);
        if(it && qty>0) lines.push({ item: it, qty });
      }
      return lines;
    }

    function totals(){
      const lines = cartLines();
      let cnt=0, total=0;
      for(const ln of lines){
        cnt += ln.qty;
        total += (ln.item.final_price||ln.item.price) * ln.qty;
      }
      return { cnt, total };
    }

    function renderBottom(){
      const t = totals();
      $('#sum').textContent = money(t.total) + ' تومان';
      $('#cnt').textContent = t.cnt + ' آیتم';
    }

    function itemCard(it){
      const d = it.discount_percent>0;
      const priceHtml = d
        ? `<span class="price">${money(it.final_price)}</span><span class="strike">${money(it.price)}</span> <span class="badge" style="border-color:rgba(255,207,90,.45)">-${it.discount_percent}%</span>`
        : `<span class="price">${money(it.price)}</span>`;

      const disabled = it.is_available!==1;
      const btns = disabled
        ? `<span class="badge" style="border-color:rgba(255,90,122,.45);color:rgba(255,90,122,.9)">ناموجود</span>`
        : `<div class="row" style="gap:8px">
            <button class="btn" data-sub="${it.id}">-</button>
            <button class="btn primary" data-add="${it.id}">+</button>
          </div>`;

      const inCart = cart[it.id]||0;

      return `<div class="card" style="margin-top:10px;padding:12px">
        <div class="item">
          <div style="flex:1">
            <h3>${it.name}</h3>
            <div class="meta">${it.description||''}</div>
            <div style="height:8px"></div>
            <div class="row" style="justify-content:space-between;align-items:center">
              <div>${priceHtml}</div>
              <div style="display:flex;align-items:center;gap:10px">
                ${inCart?`<span class="badge">در سبد: ${inCart}</span>`:''}
                ${btns}
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }

    function renderList(el, items){
      el.innerHTML = items.length? items.map(itemCard).join('') : `<p class="small">موردی نیست</p>`;
    }

    function bindButtons(root=document){
      $$('[data-add]', root).forEach(b=>b.addEventListener('click', ()=>add(parseInt(b.dataset.add,10))));
      $$('[data-sub]', root).forEach(b=>b.addEventListener('click', ()=>sub(parseInt(b.dataset.sub,10))));
    }

    async function load(){
      const j = await api('/api/menu');
      DATA = j;
      // shop open
      if(!j.shop.open){
        const box = $('#shopClosed');
        box.style.display='block';
        box.innerHTML = `<b>سفارش‌گیری غیرفعال است</b><div class="small" style="margin-top:6px">${(j.shop.message||'')}</div>`;
      }

      renderList($('#featured'), j.featured||[]);
      renderList($('#discounted'), (j.discounted||[]).slice(0,20));

      // categories chips
      const cats = [{id:0,name:'همه'}].concat(j.categories||[]);
      $('#cats').innerHTML = cats.map((c,i)=>`<div class="chip ${i===0?'active':''}" data-cat="${c.id}">${c.name}</div>`).join('');

      function renderMenu(){
        const q = ($('#search').value||'').trim();
        const activeCat = parseInt($('#cats .chip.active')?.dataset.cat||'0',10);
        let list = (j.items||[]).filter(x=>x.is_available===1);
        if(activeCat) list = list.filter(x=>x.category_id===activeCat);
        if(q) list = list.filter(x=> (x.name||'').includes(q));
        $('#items').innerHTML = list.map(itemCard).join('') || `<p class="small">موردی پیدا نشد</p>`;
        bindButtons($('#items'));
      }

      bindButtons($('#featured'));
      bindButtons($('#discounted'));

      $('#search').addEventListener('input', renderMenu);
      $$('#cats .chip').forEach(ch=>ch.addEventListener('click', ()=>{
        $$('#cats .chip').forEach(x=>x.classList.remove('active'));
        ch.classList.add('active');
        renderMenu();
      }));

      renderMenu();
      renderBottom();
    }

    // Cart view
    $('#viewCart').addEventListener('click', ()=>{
      const lines = cartLines();
      if(!lines.length){ toast('سبد خالی است'); return; }
      const t = totals();
      const html = lines.map(ln=>`<tr><td>${ln.item.name}</td><td>${ln.qty}</td><td>${money((ln.item.final_price||ln.item.price)*ln.qty)}</td></tr>`).join('');
      $('#invoiceBox').style.display='block';
      $('#invoiceBox').innerHTML = `<div class="card">
        <div class="h1" style="font-size:18px">سبد شما</div>
        <table class="table"><thead><tr><th>آیتم</th><th>تعداد</th><th>جمع</th></tr></thead><tbody>${html}</tbody></table>
        <div class="row" style="justify-content:space-between;align-items:center">
          <div class="badge">مبلغ کل: ${money(t.total)} تومان</div>
          <button class="btn" id="closeInv">بستن</button>
        </div>
      </div>`;
      $('#closeInv').addEventListener('click', ()=>$('#invoiceBox').style.display='none');
      window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' });
    });

    // Submit order -> show invoice -> confirm
    $('#submit').addEventListener('click', async ()=>{
      const lines = cartLines();
      if(!lines.length){ toast('سبد خالی است'); return; }
      const payload = {
        table_no: parseInt(localStorage.getItem('table_no'),10),
        note: '',
        lines: lines.map(l=>({ item_id: l.item.id, qty: l.qty }))
      };

      // show confirm invoice
      const t = totals();
      const rows = lines.map(ln=>`<tr><td>${ln.item.name}</td><td>${ln.qty}</td><td>${money((ln.item.final_price||ln.item.price)*ln.qty)}</td></tr>`).join('');

      $('#invoiceBox').style.display='block';
      $('#invoiceBox').innerHTML = `<div class="card" style="border-color:rgba(25,255,143,.35)">
        <div class="h1" style="font-size:18px">فاکتور</div>
        <div class="small">پس از تایید گارسون، برای صندوق ارسال می‌شود.</div>
        <div style="height:10px"></div>
        <table class="table"><thead><tr><th>آیتم</th><th>تعداد</th><th>جمع</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="row" style="justify-content:space-between;align-items:center">
          <div class="badge">مبلغ کل: ${money(t.total)} تومان</div>
          <div class="row" style="gap:8px">
            <button class="btn" id="cancelOrder">لغو</button>
            <button class="btn primary" id="confirmOrder">تایید و ارسال</button>
          </div>
        </div>
      </div>`;

      $('#cancelOrder').addEventListener('click', ()=>$('#invoiceBox').style.display='none');
      $('#confirmOrder').addEventListener('click', async ()=>{
        try{
          $('#confirmOrder').disabled = true;
          const res = await api('/api/orders', { method:'POST', body: JSON.stringify(payload) });
          localStorage.setItem('last_order_code', res.order.receipt_code);
          localStorage.removeItem('cart');
          toast('ثبت شد');
          setTimeout(()=>location.href='/track?code='+encodeURIComponent(res.order.receipt_code), 350);
        }catch(e){
          toast(e.message);
          $('#confirmOrder').disabled = false;
        }
      });

      window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' });
    });

    // Feedback
    $('#sendMsg').addEventListener('click', async ()=>{
      const m = ($('#msg').value||'').trim();
      if(m.length<2){ toast('پیام کوتاه است'); return; }
      try{
        await api('/api/feedback', { method:'POST', body: JSON.stringify({ table_no: parseInt(tableNo,10), message: m }) });
        $('#msg').value='';
        toast('ارسال شد');
      }catch(e){ toast(e.message); }
    });

    load().catch(e=>toast(e.message));
  `;

  return layout({ title:'منو', body, script });
}
