
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
window.onload = cargarDatos;

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
  // Export simple: texto (rápido). Si luego querés exportar “como se ve”, pasamos a html2canvas.
  const txt = document.getElementById("resultado").innerText || "Sin datos";
  const margin = 40;
  const lines = doc.splitTextToSize(txt, 515);
  doc.text("Ficha de Productor", margin, margin);
  doc.text(lines, margin, margin + 20);
  doc.save("productor.pdf");
}
