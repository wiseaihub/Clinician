// WISE Clinician Assistant — Background (MV3)
// Features: repo search (persist), capture + snapshot merging, CDSS plan synthesis,
// export workspace (Blob), logs/telemetry, safe “no data” guard before report.

function nowIso(){ return new Date().toISOString(); }
async function logStep(tag, message){
  const entry = { tag, message, ts: nowIso() };
  const st = await chrome.storage.local.get(["lastSteps"]);
  const steps = st.lastSteps || [];
  steps.push(entry); if (steps.length > 500) steps.shift();
  await chrome.storage.local.set({ lastSteps: steps });
  try { await chrome.runtime.sendMessage({ action: "cdss_log", entry }); } catch (_) {}
}
async function toolEvent(tool, meta){
  const ev = { ts: nowIso(), tool, meta: meta || {} };
  const st = await chrome.storage.local.get(["tool_events","tool_counters"]);
  const events = st.tool_events || [];
  const counters = st.tool_counters || {};
  events.push(ev); if (events.length > 500) events.shift();
  counters[tool] = (counters[tool]||0) + 1;
  await chrome.storage.local.set({ tool_events: events, tool_counters: counters });
}

// ---------- capture & snapshot ----------
function mergeSnapshot(dst, src){
  const out = Object.assign({}, dst||{});
  const arrMerge = (a,b)=> Array.from(new Set([...(a||[]), ...(b||[])]));
  if (src.diagnosis) out.diagnosis = src.diagnosis;
  if (src.symptoms) out.symptoms = arrMerge(out.symptoms, src.symptoms);
  if (src.medications) out.medications = arrMerge(out.medications, src.medications);
  if (src.investigations_advised) out.investigations_advised = arrMerge(out.investigations_advised, src.investigations_advised);
  if (src.notes) out.notes = out.notes ? (out.notes + "\n" + src.notes) : src.notes;
  if (src.vitals) out.vitals = Object.assign({}, out.vitals||{}, src.vitals||{});
  if (src.patient) out.patient = Object.assign({}, out.patient||{}, src.patient||{});
  out.updated_at = nowIso();
  return out;
}

function initials(name){
  if(!name) return "P";
  const parts = String(name).split(/\s+/).filter(Boolean);
  return parts.slice(0,2).map(p=>p[0].toUpperCase()).join('.') + (parts.length?'.':'');
}
function keyForSeed(seed){
  const host = new URL(seed.origin || "https://dev.wisedoctor.in").host;
  if (seed.patientId) return seed.patientId + "@" + host;
  const str = `${host}|${seed.caseFileId||""}|${seed.clinicId||""}|${seed.mrn||""}|${seed.masked?.name||""}`;
  let h=0; for (let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0; }
  return ("X"+(h>>>0).toString(16)).toUpperCase()+"@"+host;
}
async function setCurrentPatientFromSeed(seed){
  const patientKey = keyForSeed(seed);
  const label = (seed.masked && seed.masked.name) ? "P-"+initials(seed.masked.name) : (seed.patientId ? "P-"+seed.patientId : "P-"+patientKey.slice(0,4));
  const currentPatient = { patientKey, label };
  await chrome.storage.local.set({ currentPatient });
  return currentPatient;
}
async function captureFragment(patientKey, fragment){
  const st = await chrome.storage.local.get(["captures","snapshots","capture_index","capture_sources"]);
  const captures = st.captures || {};
  const snapshots = st.snapshots || {};
  const idx = st.capture_index || {};
  const srcs = st.capture_sources || {};

  captures[patientKey] = captures[patientKey] || [];
  snapshots[patientKey] = mergeSnapshot(snapshots[patientKey], fragment.data||{});
  idx[patientKey] = idx[patientKey] || {};
  srcs[patientKey] = srcs[patientKey] || {};

  const src = fragment.source || "unknown";
  idx[patientKey][src] = (idx[patientKey][src]||0) + 1;
  srcs[patientKey][src] = true;
  captures[patientKey].push({ ts: nowIso(), source: src, href: fragment.href||"", data: fragment.data||{} });

  await chrome.storage.local.set({ captures, snapshots, capture_index: idx, capture_sources: srcs });
  await toolEvent("dom_scrape.capture_fragment", { source: src });
  await logStep("Verification", "Stored capture from " + src);
  return { ok:true };
}

// ---------- report ----------
function computeConfidence(snapshot){
  let score = 0;
  if(snapshot.diagnosis) score += 3;
  if(Array.isArray(snapshot.symptoms) && snapshot.symptoms.length) score += 3;
  if(Array.isArray(snapshot.investigations_advised) && snapshot.investigations_advised.length) score += 2;
  if(snapshot.vitals && (snapshot.vitals.bp || snapshot.vitals.temp)) score += 2;
  return Math.max(0, Math.min(10, score));
}

async function runCdss(){
  await logStep("Planning", "Starting CDSS chain");
  const st = await chrome.storage.local.get(["currentPatient","snapshots","includeLocalRepository"]);
  const cp = st.currentPatient; const pk = cp && cp.patientKey;
  const snap = (st.snapshots||{})[pk] || {};

  // require at least some data
  const hasData = !!(snap.diagnosis || (snap.symptoms||[]).length || (snap.investigations_advised||[]).length || Object.keys(snap.vitals||{}).length || (snap.medications||[]).length);
  if (!hasData) {
    await logStep("Verification","No snapshot data; ask user to capture first.");
    return { ok:false, error:"no_snapshot_data" };
  }

  await logStep("Lookup","Using captured snapshot and local repository="+ (!!st.includeLocalRepository));

  const conf = computeConfidence(snap);
  const plan = { assessment:[], investigations:[], treatment:[], counseling:[] };
  const evidence = [];

  let exec = "Not enough case/evidence context to propose a strong plan. Consider capturing more case-sheet detail or retrying later.";
  if (conf >= 6) exec = "Sufficient structured case data detected. Proposed plan synthesized from captured context and prior knowledge.";

  if (snap.diagnosis){
    evidence.push({ point: "Working diagnosis: "+snap.diagnosis, weight: 7, link:"" });
    plan.assessment.push({ label:"Reconfirm diagnosis rationale", confidence: conf, rationale:"Cross-check symptom onset and vitals." });
  }
  if (Array.isArray(snap.symptoms) && snap.symptoms.length){
    plan.assessment.push({ label:"Symptom timeline review", confidence: Math.max(0, conf-1), rationale:"Progression informs severity." });
  }
  if (Array.isArray(snap.investigations_advised) && snap.investigations_advised.length){
    plan.investigations = snap.investigations_advised.map(t => ({ label:String(t), confidence: Math.max(6, conf-2), rationale:"Verify indications & urgency." }));
    evidence.push({ point:"Investigations advised by clinician", weight:6, link:"" });
  }
  if (Array.isArray(snap.medications) && snap.medications.length){
    plan.treatment.push({ label:"Review medications for interactions/dosing", confidence: Math.max(6, conf-2), rationale:"Check renal/hepatic adjustments." });
  }
  plan.counseling.push({ label:"Explain red flags & when to seek urgent care", confidence: Math.max(6, conf-3), rationale:"Improves safety netting." });

  const lastReport = {
    generated_at: nowIso(),
    executive_summary: exec,
    confidence: conf,
    plan,
    evidence,
    patient_context: {
      label: (cp && cp.label) || "—",
      diagnosis: snap.diagnosis || "",
      symptoms: snap.symptoms || [],
      medications: snap.medications || [],
      investigations_advised: snap.investigations_advised || [],
      vitals: snap.vitals || {}
    }
  };

  await chrome.storage.local.set({ lastReport });
  await logStep("Verification","Report assembled");
  try { await chrome.runtime.sendMessage({ action:"cdss_complete" }); } catch(_) {}
  return { ok:true };
}

// ---------- export ----------
async function exportWorkspace(){
  try{
    const st = await chrome.storage.local.get(["currentPatient","captures","snapshots","lastReport","tool_events","tool_counters"]);
    const pk = st.currentPatient && st.currentPatient.patientKey;
    const bundle = {
      exported_at: nowIso(),
      patient: st.currentPatient || {},
      captures: (st.captures||{})[pk] || [],
      snapshot: (st.snapshots||{})[pk] || {},
      lastReport: st.lastReport || {},
      tools: { events: st.tool_events||[], counts: st.tool_counters||{} }
    };
    const blob = new Blob([JSON.stringify(bundle,null,2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({
      url,
      filename: `WISE_CDSS/${(st.currentPatient&&st.currentPatient.label)||"patient"}/workspace_${Date.now()}.json`,
      saveAs: true
    });
    await logStep("Verification","Workspace exported");
    return { ok:true };
  }catch(e){
    await logStep("Verification","Export failed: "+String(e));
    return { ok:false, error: String(e) };
  }
}

// ---------- repository search (persist results) ----------
async function repoSearch(q){
  const { serpApiKey } = await chrome.storage.local.get(["serpApiKey"]);
  if(!serpApiKey) return { ok:false, error:"no_serp_key" };
  await logStep("Lookup","Repo search: "+q);
  try{
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine","google");
    url.searchParams.set("q", q);
    url.searchParams.set("num","10");
    url.searchParams.set("api_key", serpApiKey);
    const res = await fetch(url.toString(), { method:"GET" });
    if(!res.ok) return { ok:false, error:"serpapi_"+res.status };
    const data = await res.json();
    const results = (data.organic_results||[]).slice(0,10);
    await toolEvent("serpapi.search", { q });
    await chrome.storage.local.set({ repo_last_query: q, repo_last_results: results });
    return { ok:true, results };
  }catch(e){
    return { ok:false, error:String(e) };
  }
}

// ---------- router ----------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.action === "content_push_capture") {
        const p = msg.payload || {};
        const seed = {
          origin: p.origin || p.page?.url || sender?.url || "",
          patientId: p.patient?.patientId || "",
          clinicId: p.patient?.clinicId || "",
          caseFileId: p.patient?.caseFileId || "",
          mrn: p.patient?.mrn || "",
          masked: { name: p.patient?.label || "" }
        };
        const currentPatient = await setCurrentPatientFromSeed(seed);
        const fragment = {
          source: p.page?.source || "unknown",
          href: p.page?.url || sender?.url || "",
          data: p.data || {}
        };
        const r = await captureFragment(currentPatient.patientKey, fragment);
        sendResponse(r); return;
      }

      if (msg?.action === "run_cdss") { sendResponse(await runCdss()); return; }
      if (msg?.action === "export_workspace") { sendResponse(await exportWorkspace()); return; }
      if (msg?.action === "set_patient_label") {
        const st = await chrome.storage.local.get(["currentPatient"]);
        if (!st.currentPatient) { sendResponse({ ok:false, error:"no_current_patient" }); return; }
        st.currentPatient.label = String(msg.label||"Patient");
        await chrome.storage.local.set({ currentPatient: st.currentPatient });
        sendResponse({ ok:true, currentPatient: st.currentPatient }); return;
      }
      if (msg?.action === "repo_search") { sendResponse(await repoSearch(msg.q||"")); return; }

    } catch (e) {
      sendResponse({ ok:false, error:String(e) });
    }
  })();
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ __installed_at: nowIso() });
});
