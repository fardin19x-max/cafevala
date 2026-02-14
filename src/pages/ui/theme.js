export const THEME_CSS = `
:root{
  --bg:#07100c;
  --card:#0b1a12;
  --line:rgba(156,255,200,.14);
  --mint:#19ff8f;
  --text:#e9fff4;
  --muted:rgba(233,255,244,.72);
  --danger:#ff5a7a;
  --warn:#ffcf5a;
  --radius:16px;
}
*{box-sizing:border-box}
html,body{height:100%}
body{margin:0;background:radial-gradient(1200px 800px at 10% -10%, rgba(25,255,143,.16), transparent 60%), var(--bg); color:var(--text); font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;}
a{color:inherit}
.container{max-width:960px;margin:0 auto;padding:20px 14px 90px;}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px;}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.12em}
.badge{font-size:12px;color:var(--muted);border:1px solid var(--line);padding:6px 10px;border-radius:999px;}
.card{background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02)); border:1px solid var(--line); border-radius:var(--radius); padding:14px; box-shadow:0 10px 30px rgba(0,0,0,.35);}
.h1{font-size:26px;margin:8px 0 6px;font-weight:900}
.p{margin:0;color:var(--muted);line-height:1.6}
.row{display:flex;gap:10px;flex-wrap:wrap}
.btn{appearance:none;border:1px solid var(--line); background:transparent; color:var(--text); padding:10px 12px;border-radius:12px;cursor:pointer;font-weight:700}
.btn:hover{border-color:rgba(25,255,143,.55)}
.btn.primary{background:rgba(25,255,143,.14);border-color:rgba(25,255,143,.45)}
.btn.danger{background:rgba(255,90,122,.12);border-color:rgba(255,90,122,.45)}
.btn.ghost{background:transparent}
.small{font-size:12px;color:var(--muted)}
.input{width:100%;padding:12px 12px;border-radius:12px;border:1px solid var(--line);background:rgba(0,0,0,.18);color:var(--text);outline:none}
.input:focus{border-color:rgba(25,255,143,.55)}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}
.col-12{grid-column:span 12}
.col-6{grid-column:span 6}
@media(max-width:720px){.col-6{grid-column:span 12}}

.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{padding:8px 10px;border-radius:999px;border:1px solid var(--line);color:var(--muted);cursor:pointer;user-select:none}
.chip.active{border-color:rgba(25,255,143,.55);color:var(--text);background:rgba(25,255,143,.10)}

.item{display:flex;gap:12px;align-items:flex-start}
.item h3{margin:0 0 4px;font-size:15px}
.item .meta{color:var(--muted);font-size:12px}
.price{font-weight:900}
.strike{color:rgba(233,255,244,.45);text-decoration:line-through;font-weight:700;font-size:12px;margin-left:6px}

.bottomBar{position:fixed;left:0;right:0;bottom:0;padding:10px 14px;background:rgba(7,16,12,.78);backdrop-filter:blur(10px);border-top:1px solid var(--line);}
.bottomInner{max-width:960px;margin:0 auto;display:flex;align-items:center;gap:10px;justify-content:space-between}

.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:90px;background:#06110c;border:1px solid var(--line);padding:10px 12px;border-radius:12px;display:none;max-width:min(520px,92vw)}
.toast.show{display:block}

.tabs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.tab{padding:10px 12px;border:1px solid var(--line);border-radius:999px;color:var(--muted);cursor:pointer}
.tab.active{color:var(--text);border-color:rgba(25,255,143,.55);background:rgba(25,255,143,.10)}

.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:10px;border-bottom:1px solid var(--line);text-align:left;font-size:13px}
.table th{color:var(--muted);font-weight:800}

`;
