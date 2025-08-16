// === Config ===
let datos = [];
const JSON_URL = "productores-github.json"; // mismo nombre

// === Carga de datos ===
async function cargarDatos() {
  try {
    const r = await fetch(JSON_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`No se pudo leer ${JSON_URL}`);
    const json = await r.json();
    // Acepta array o {data:[...]}
    datos = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
    // console.log("Registros cargados:", datos.length);
  } catch (e) {
    console.error("Error cargando datos", e);
    datos = [];
  }
}

window.onload = () => {
  cargarDatos();
  initComisiones();
};

// === Utilitarios ===
function estadoBadge(estadoRaw){
  const val = String(estadoRaw || "").trim().toUpperCase();
  if (val.includes("ACTIVO") && !val.startsWith("IN-")) return `<span class="badge ok">ACTIVO</span>`;
  if (val.startsWith("IN-")) return `<span class="badge bad">IN-ACTIVO</span>`;
  return `<span class="badge warn">${estadoRaw ?? "SIN ESTADO"}</span>`;
}

// Normaliza un registro con distintos esquemas de claves
function normalizar(p){
  return {
    codigo: p.codigo ?? p.Codigo ?? p.id ?? p.ID ?? "-",
    nombre: p.nombre ?? p.Nombre ?? p.razon_social ?? p.razonSocial ?? "-",
    fantasia: p.nombre_fantasia ?? p["Nombre de Fantasia"] ?? p.fantasia ?? "-",
    organizador: p.organizador ?? p["Nombre de Fantasia (Superior)"] ?? p.organizador_nombre ?? "-",
    unidad_operativa: p.unidad_operativa ?? p["Unidad Operativa"] ?? p.uo ?? "-",
    codigo_unidad_operativa: p.codigo_unidad_operativa ?? p["Codigo de Unidad Operativa"] ?? p.uo_codigo ?? "-",
    ejecutivo: p.ejecutivo ?? p["Ejecutivo de Cuenta Dfl"] ?? p.ejecutivo_cuenta ?? "-",
    estado: p.estado ?? p.Estado ?? "-",
  };
}

function renderFicha(pRaw){
  const p = normalizar(pRaw);
  const cont = document.getElementById("resultado");
  cont.innerHTML = `
    <div class="ficha-header">
      <div class="ficha-title">Ficha del productor #${p.codigo ?? "-"}</div>
      ${estadoBadge(p.estado)}
    </div>

    <div class="dl">
      <div class="dt">Código:</div><div class="dd">${p.codigo ?? "-"}</div>
      <div class="dt">Nombre:</div><div class="dd">${p.nombre ?? "-"}</div>
      <div class="dt">Nombre de Fantasía:</div><div class="dd">${p.fantasia ?? "-"}</div>
      <div class="dt">Organizador:</div><div class="dd">${p.organizador ?? "-"}</div>
      <div class="dt">Unidad Operativa:</div><div class="dd">${p.unidad_operativa ?? "-"}</div>
      <div class="dt">Código Unidad Operativa:</div><div class="dd">${p.codigo_unidad_operativa ?? "-"}</div>
      <div class="dt">Ejecutivo:</div><div class="dd">${p.ejecutivo ?? "-"}</div>
      <div class="dt">Estado:</div><div class="dd">${p.estado ?? "-"}</div>
    </div>
  `;
}

function buscarProductor(){
  const codigo = (document.getElementById("input-codigo").value || "").trim();
  const match = datos.find(p => {
    const cand = String(p.codigo ?? p.Codigo ?? p.id ?? p.ID ?? "").trim();
    return cand === codigo;
  });
  const cont = document.getElementById("resultado");

  if (!match){
    cont.innerHTML = `<div class="placeholder">No se encontró el productor.</div>`;
    return;
  }
  renderFicha(match);
}

// === PDF ===
async function exportarPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const fichaTxt = (document.getElementById("resultado").innerText || "").trim();

  const c = leerComisiones();
  const obs = (document.getElementById("observaciones").value || "").trim();
  const comTxt =
`COMISIONES
- Productor: ${fmtPct(c.productor)}
- Organizador: ${fmtPct(c.organizador)}
- Otras 1: ${fmtPct(c.otras1)}
- Otras 2: ${fmtPct(c.otras2)}
- Total: ${fmtPct(c.productor + c.organizador + c.otras1 + c.otras2)}

OBSERVACIONES
${obs || "(sin observaciones)"}`.replace(/\n{3,}/g, "\n\n");

  const margin = 48;
  let y = margin;

  doc.setFontSize(14);
  doc.text("Ficha de Productor", margin, y); y += 16;
  doc.setFontSize(11);

  const fichaLines = doc.splitTextToSize(fichaTxt, 515);
  doc.text(fichaLines, margin, y);
  y += fichaLines.length * 14 + 18;

  doc.setFontSize(14); doc.text("Comisiones y Observaciones", margin, y); y += 16;
  doc.setFontSize(11);
  const comLines = doc.splitTextToSize(comTxt, 515);
  if (y + comLines.length * 14 > 780){
    doc.addPage(); y = margin;
  }
  doc.text(comLines, margin, y);

  doc.save("productor.pdf");
}

// === Comisiones ===
function fmtPct(val){
  if (isNaN(val)) return "0,00%";
  return (Math.round(val * 100) / 100).toFixed(2).replace(".", ",") + "%";
}
function clampPct(n){
  if (isNaN(n) || n < 0) return 0;
  if (n > 100) return 100;
  return n;
}
function leerComisiones(){
  const v = id => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const raw = (el.value || "").replace(",", ".");
    const n = parseFloat(raw);
    return clampPct(isNaN(n) ? 0 : n);
  };
  return {
    productor: v("com-productor"),
    organizador: v("com-organizador"),
    otras1: v("com-otras1"),
    otras2: v("com-otras2"),
  };
}
function actualizarComisiones(){
  const c = leerComisiones();
  const total = c.productor + c.organizador + c.otras1 + c.otras2;

  // Resumen
  const S = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  S("v-productor",   fmtPct(c.productor));
  S("v-organizador", fmtPct(c.organizador));
  S("v-otras1",      fmtPct(c.otras1));
  S("v-otras2",      fmtPct(c.otras2));

  // Total
  const fill = document.getElementById("total-fill");
  const text = document.getElementById("total-text");
  if (fill) fill.style.width = Math.min(total, 100) + "%";
  if (text) text.textContent = fmtPct(total);
}

function initComisiones(){
  ["com-productor","com-organizador","com-otras1","com-otras2"].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", actualizarComisiones);
    el.addEventListener("blur", actualizarComisiones);

    // UX: si el campo estaba en 0, al enfocar se limpia
    el.addEventListener("focus", () => {
      if (el.value === "0" || el.value === "0,00" || el.value === "0.00"){ el.value = ""; }
      else { el.select(); }
    });
    // Evita que escribir un dígito sobre "0" termine en "100"
    el.addEventListener("keydown", (ev) => {
      const d = ev.key;
      const isDigit = d.length === 1 && d >= "0" && d <= "9";
      if (isDigit && (el.value === "0" || el.value === "0,00" || el.value === "0.00")){
        ev.preventDefault();
        el.value = d;
        actualizarComisiones();
      }
    });
  });
  actualizarComisiones();
}

// === Nueva consulta (resetea todo) ===
function nuevaConsulta(){
  const input = document.getElementById("input-codigo");
  const cont  = document.getElementById("resultado");
  if (input){ input.value = ""; input.focus(); }
  if (cont){
    cont.innerHTML = `<div class="placeholder">Ingresá un código para ver la ficha…</div>`;
  }
  // Reset comisiones + observaciones
  ["com-productor","com-organizador","com-otras1","com-otras2"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const obs = document.getElementById("observaciones");
  if (obs) obs.value = "";
  actualizarComisiones();
}
