
let datos = [];
const JSON_URL = "productores-github.json"; // si luego dividís, apuntá acá a la parte 1 o a un endpoint

async function cargarDatos() {
  try {
    const r = await fetch(JSON_URL, { cache: "no-store" });
    datos = await r.json();
  } catch (e) {
    console.error("Error cargando datos", e);
  }
}
window.onload = () => {
  cargarDatos();
  initComisiones();
};

function estadoBadge(estadoRaw){
  const val = String(estadoRaw || "").trim().toUpperCase();
  if (val.includes("ACTIVO") && !val.startsWith("IN-")) return `<span class="badge ok">ACTIVO</span>`;
  if (val.startsWith("IN-")) return `<span class="badge bad">IN-ACTIVO</span>`;
  return `<span class="badge warn">${estadoRaw ?? "SIN ESTADO"}</span>`;
}

function renderFicha(p){
  const cont = document.getElementById("resultado");
  cont.innerHTML = `
    <div class="ficha-header">
      <div class="ficha-title">Ficha del productor #${p.codigo ?? p.Codigo ?? "-"}</div>
      ${estadoBadge(p.estado ?? p.Estado)}
    </div>

    <div class="dl">
      <div class="dt">Código:</div><div class="dd">${p.codigo ?? p.Codigo ?? "-"}</div>
      <div class="dt">Nombre:</div><div class="dd">${p.nombre ?? p.Nombre ?? "-"}</div>
      <div class="dt">Nombre de Fantasía:</div><div class="dd">${p.nombre_fantasia ?? p["Nombre de Fantasia"] ?? "-"}</div>
      <div class="dt">Organizador:</div><div class="dd">${p.organizador ?? p["Nombre de Fantasia (Superior)"] ?? "-"}</div>
      <div class="dt">Unidad Operativa:</div><div class="dd">${p.unidad_operativa ?? p["Unidad Operativa"] ?? "-"}</div>
      <div class="dt">Código Unidad Operativa:</div><div class="dd">${p.codigo_unidad_operativa ?? p["Codigo de Unidad Operativa"] ?? "-"}</div>
      <div class="dt">Ejecutivo:</div><div class="dd">${p.ejecutivo ?? p["Ejecutivo de Cuenta Dfl"] ?? "-"}</div>
      <div class="dt">Estado:</div><div class="dd">${p.estado ?? p.Estado ?? "-"}</div>
    </div>
  `;
}

function buscarProductor(){
  const codigo = document.getElementById("input-codigo").value.trim();
  const match = datos.find(p => String(p.codigo ?? p.Codigo).trim() === codigo);
  const cont = document.getElementById("resultado");

  if (!match){
    cont.innerHTML = `<div class="placeholder">No se encontró el productor.</div>`;
    return;
  }
  renderFicha(match);
}

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
${obs || "(sin observaciones)"}`
  .replace(/\n{3,}/g, "\n\n");

  const margin = 48;
  let y = margin;

  doc.setFontSize(14);
  doc.text("Ficha de Productor", margin, y); y += 16;
  doc.setFontSize(11);

  // Ficha (salto automático)
  const fichaLines = doc.splitTextToSize(fichaTxt, 515);
  doc.text(fichaLines, margin, y);
  y += fichaLines.length * 14 + 18;

  // Comisiones
  doc.setFontSize(14); doc.text("Comisiones y Observaciones", margin, y); y += 16;
  doc.setFontSize(11);
  const comLines = doc.splitTextToSize(comTxt, 515);
  // Nueva página si no entra
  if (y + comLines.length * 14 > 780){
    doc.addPage(); y = margin;
  }
  doc.text(comLines, margin, y);

  doc.save("productor.pdf");
}


function nuevaConsulta(){
  document.getElementById("input-codigo").value = "";
  document.getElementById("resultado").innerHTML =
    `<div class="placeholder">Ingresá un código para ver la ficha…</div>`;
}

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
  const p = parseFloat(document.getElementById("com-productor").value.replace(",", ".")) || 0;
  const o = parseFloat(document.getElementById("com-organizador").value.replace(",", ".")) || 0;
  const x1 = parseFloat(document.getElementById("com-otras1").value.replace(",", ".")) || 0;
  const x2 = parseFloat(document.getElementById("com-otras2").value.replace(",", ".")) || 0;
  return {
    productor: clampPct(p),
    organizador: clampPct(o),
    otras1: clampPct(x1),
    otras2: clampPct(x2),
  };
}

function actualizarComisiones(){
  const c = leerComisiones();
  const total = c.productor + c.organizador + c.otras1 + c.otras2;

  // Resumen
  document.getElementById("v-productor").textContent   = fmtPct(c.productor);
  document.getElementById("v-organizador").textContent = fmtPct(c.organizador);
  document.getElementById("v-otras1").textContent      = fmtPct(c.otras1);
  document.getElementById("v-otras2").textContent      = fmtPct(c.otras2);

  // Total (ancho cap a 100%)
  const fill = document.getElementById("total-fill");
  const text = document.getElementById("total-text");
  fill.style.width = Math.min(total, 100) + "%";
  text.textContent = fmtPct(total);
}

// Inicializa listeners de inputs
function initComisiones(){
  ["com-productor","com-organizador","com-otras1","com-otras2"].forEach(id=>{
    const el = document.getElementById(id);
    if (el){
      el.addEventListener("input", actualizarComisiones);
      el.addEventListener("blur", actualizarComisiones);
    }
  });
  actualizarComisiones();
}
