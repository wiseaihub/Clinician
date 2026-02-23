(() => {
  'use strict';

  // ---------- helpers ----------
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const txt = el => (el && (el.innerText || el.textContent) || '').trim();
  const clean = s => (s||'').replace(/\s+/g,' ').trim();
  const uniq = arr => Array.from(new Set((arr||[]).map(s=>clean(String(s||''))).filter(Boolean)));
  const parseQS = () => { try { return new URL(location.href).searchParams; } catch { return new URLSearchParams(); } };
  const hash = str => { let h=0x811c9dc5; str=String(str||''); for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=(h+((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)))>>>0; } return ('00000000'+h.toString(16)).slice(-8); };
  const maskPII = obj => { const s=JSON.stringify(obj); const m=s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[email]').replace(/\b(\+?\d[\d\s\-().]{6,}\d)\b/g,'[phone]'); try{ return JSON.parse(m);}catch{ return obj;} };

  // ---------- page context ----------
  const isCaseSheet = /\/doctor\/case-sheet\/view/i.test(location.pathname);
  const isRxPrint   = /\/doctor\/diagnosis\/print/i.test(location.pathname);
  let source = isCaseSheet ? 'case_sheet' : (isRxPrint ? 'rx_page' : 'general');

  const qs = parseQS();
  const patientId = qs.get('patientId') || '';
  const clinicId = qs.get('clinicId') || '';
  const caseFileId = qs.get('caseFileId') || '';
  const prescriptionId = qs.get('prescriptionId') || '';
  const patientKey = (patientId ? (patientId + '@' + location.host) : (hash(document.title+location.host) + '@' + location.host));
  const patientLabel = patientId ? ('P-' + patientId) : ('P-' + hash(document.title).toUpperCase());

  // ---------- extractors ----------
  function findByHeadingText(needles){
    const labels = (Array.isArray(needles)?needles:[needles]).map(x=>String(x).toLowerCase());
    const candidates = $$('h1,h2,h3,h4,strong,b,span,div');
    const out = [];
    for(const el of candidates){
      const t = txt(el).toLowerCase();
      if(!t) continue;
      for(const lab of labels){
        if(t.includes(lab)){
          let card = el.closest('[class*="card"],[class*="section"],section,article,div');
          if(!card) card = el.parentElement || el;
          out.push(card);
          break;
        }
      }
    }
    return out;
  }

  function extractListFromBlock(block){
    if(!block) return [];
    const items = [];
    $$('.mantine-List-item, li', block).forEach(li => items.push(txt(li)));
    $$('table tr', block).forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(c=>clean(txt(c))).filter(Boolean);
      if(cells.length >= 1) items.push(cells.join(' | '));
    });
    $$('[class*="Chip"], [class*="Tag"], [class*="Badge"]', block).forEach(ch => items.push(txt(ch)));
    if(items.length === 0){
      const raw = clean(txt(block));
      raw.split(/[,;•|\n]+/).forEach(s => { if(s.trim().length>2) items.push(s.trim()); });
    }
    return uniq(items);
  }

  function extractKeyValuePairs(block){
    const kv = {};
    if(!block) return kv;
    $$('table tr', block).forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(c=>clean(txt(c)));
      if(cells.length >= 2){
        const k = cells[0].toLowerCase();
        kv[k] = cells.slice(1).join(' | ');
      }
    });
    return kv;
  }

  function extractDiagnosis(){
    const blocks = findByHeadingText(['Diagnosis','Provisional diagnosis','Final diagnosis']);
    for(const b of blocks){
      const t = clean(txt(b));
      const m = t.match(/diagnosis\s*[:\-]\s*([^\n]+)/i);
      if(m) return clean(m[1]);
      const lst = extractListFromBlock(b);
      if(lst.length) return lst[0];
    }
    const body = clean(document.body.innerText || '');
    let m = body.match(/Diagnosis\s*[:\-]\s*([^\n]+)/i);
    if(m) return clean(m[1]);
    m = body.match(/Provisional\s*Diagnosis\s*[:\-]\s*([^\n]+)/i);
    if(m) return clean(m[1]);
    return '';
  }

  function extractVitals(){
    const blocks = findByHeadingText(['Vitals','Vital signs']);
    for(const b of blocks){
      const kv = extractKeyValuePairs(b);
      if(Object.keys(kv).length) return kv;
      const t = (txt(b) || '').split(/\n+/);
      const map = {};
      t.forEach(line => {
        const mm = line.match(/^\s*([A-Za-z /]+)\s*[:\-]\s*([\w ./%+-]+)\s*$/);
        if(mm) map[mm[1].toLowerCase()] = clean(mm[2]);
      });
      if(Object.keys(map).length) return map;
    }
    return {};
  }

  const extractSymptoms = () => {
    const blocks = findByHeadingText(['Symptoms','Presenting complaints','Chief complaints']);
    for(const b of blocks){ const lst = extractListFromBlock(b); if(lst.length) return lst; }
    return [];
  };

  const extractInvestigations = () => {
    const blocks = findByHeadingText(['Advised Investigations','Investigations','Lab tests']);
    for(const b of blocks){ const lst = extractListFromBlock(b); if(lst.length) return lst; }
    return [];
  };

  function extractMedicationsFromTables(root){
    const meds = [];
    $$('table', root||document).forEach(table => {
      $$('tr', table).forEach((tr,i) => {
        const cells = Array.from(tr.querySelectorAll('th,td')).map(c=>clean(txt(c)));
        if(i===0 && cells.join(' ').toLowerCase().includes('drug')) return;
        if(cells.length >= 2){
          meds.push({
            name: cells[0],
            dose: cells[1] || '',
            frequency: cells[2] || '',
            duration: cells[3] || '',
            notes: cells.slice(4).join(' | ') || ''
          });
        }
      });
    });
    return meds;
  }
  function extractRx(){
    const blocks = findByHeadingText(['Rx','Prescription','Medications','Rx Details']);
    let meds = [];
    for(const b of blocks){ meds = meds.concat(extractMedicationsFromTables(b)); }
    if(meds.length===0){ meds = extractMedicationsFromTables(document); }
    return meds;
  }

  function buildPayload(){
    const diagnosis = extractDiagnosis();
    const vitals = extractVitals();
    const symptoms = extractSymptoms();
    const investigations = extractInvestigations();
    let medications = [];
    if(isRxPrint){ medications = extractRx(); }

    const payload = {
      patient: { patientId, clinicId, caseFileId, prescriptionId, label: patientLabel },
      page: { url: location.href, title: document.title, source },
      data: { diagnosis, vitals, symptoms, investigations_advised: investigations, medications },
      ts: Date.now(),
      origin: location.origin
    };
    return maskPII(payload);
  }

  // ---------- FAB ----------
  let fabMounted = false;
  async function maybeMountFab(){
    try{
      const st = await chrome.storage.local.get(['showFab']);
      if(st && st.showFab === false) return;
    }catch(_){}
    if(fabMounted || !document.body) return;
    const id = 'wise-cdss-fab';
    if(document.getElementById(id)) { fabMounted = true; return; }
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = 'Capture Clinical Data';
    Object.assign(btn.style, {
      position:'fixed', right:'16px', bottom:'16px', zIndex: 2147483647,
      background: 'linear-gradient(135deg,#0ea5a6,#2563eb)', color:'#fff',
      border:'0', borderRadius:'999px', padding:'10px 14px', fontWeight:'700',
      boxShadow:'0 8px 24px rgba(2,6,23,.2)', cursor:'pointer'
    });
    btn.addEventListener('click', async () => {
      try{
        const payload = buildPayload();
        await chrome.runtime.sendMessage({ action: 'content_push_capture', payload });
        btn.textContent = 'Captured ✓';
        setTimeout(()=>{ btn.textContent = 'Capture Clinical Data'; }, 1200);
      }catch(e){
        btn.textContent = 'Capture failed';
        setTimeout(()=>{ btn.textContent = 'Capture Clinical Data'; }, 1500);
      }
    });
    document.body.appendChild(btn);
    fabMounted = true;
  }

  // ---------- messaging ----------
  window.__WISE_CONTENT_READY__ = true;

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      if(!msg) return;
      if(msg.action === 'ping'){
        sendResponse({ ok:true, who:'content', source, patientKey, href: location.href });
        return;
      }
      if(msg.action === 'content_capture' || msg.action === 'content_capture_now'){
        try {
          const payload = buildPayload();
          sendResponse({ ok:true, payload, patientKey, patientLabel, source });
        } catch(e){
          sendResponse({ ok:false, error: String(e) });
        }
      }
    })();
    return true;
  });

  const init = () => { maybeMountFab(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  // re-evaluate on SPA route changes
  let last = location.pathname + location.search;
  setInterval(() => {
    const now = location.pathname + location.search;
    if(now !== last){
      last = now;
      const sCase = /\/doctor\/case-sheet\/view/i.test(location.pathname);
      const sRx = /\/doctor\/diagnosis\/print/i.test(location.pathname);
      source = sCase ? 'case_sheet' : (sRx ? 'rx_page' : 'general');
      maybeMountFab();
    }
  }, 1000);
})();
