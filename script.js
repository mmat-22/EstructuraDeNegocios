
let datos = [];

async function cargarDatos() {
  try {
    const response = await fetch('productores-github.json');
    datos = await response.json();
    console.log("Datos cargados:", datos);
  } catch (error) {
    console.error("Error al cargar el JSON:", error);
  }
}

function buscarProductor() {
  const codigo = document.getElementById("input-codigo").value.trim();
  const resultado = datos.find(p => String(p.codigo).trim() === codigo);

  const contenedor = document.getElementById("resultado");
  if (!resultado) {
    contenedor.innerHTML = "<p>No se encontró el productor.</p>";
    return;
  }

  contenedor.innerHTML = `
    <p><strong>Código:</strong> ${resultado.codigo}</p>
    <p><strong>Nombre:</strong> ${resultado.nombre}</p>
    <p><strong>Nombre de Fantasía:</strong> ${resultado.nombre_fantasia || '-'}</p>
    <p><strong>Organizador:</strong> ${resultado.organizador || '-'}</p>
    <p><strong>Unidad Operativa:</strong> ${resultado.unidad_operativa}</p>
    <p><strong>Código Unidad Operativa:</strong> ${resultado.codigo_unidad_operativa}</p>
    <p><strong>Ejecutivo:</strong> ${resultado.ejecutivo}</p>
    <p><strong>Estado:</strong> ${resultado.estado}</p>
  `;
}

async function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const contenido = document.getElementById("resultado").innerText;
  doc.text("Datos del Productor", 10, 10);
  doc.text(contenido, 10, 20);
  doc.save("productor.pdf");
}

window.onload = cargarDatos;
