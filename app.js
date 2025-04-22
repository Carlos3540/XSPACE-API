const apiURL = 'https://api.spacexdata.com/v4/launches';
const mapa = L.map('mapa').setView([28.5623, -80.5774], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

const launchpadsCache = {};
const marcadoresActuales = [];

async function cargarMisiones() {
  const anio = document.getElementById("anio").value;
  const estado = document.getElementById("estado").value;
  const res = await fetch(apiURL);
  const data = await res.json();

  const contenedor = document.getElementById("misiones");
  contenedor.innerHTML = "";
  mapa.eachLayer((layer) => {
    if (layer instanceof L.Marker) mapa.removeLayer(layer);
  });
  marcadoresActuales.length = 0;

  data.forEach((mision) => {
    const fecha = new Date(mision.date_utc);
    const cumpleAnio = !anio || fecha.getFullYear() == anio;
    const cumpleEstado = estado === "" || mision.success == (estado === "true");

    if (cumpleAnio && cumpleEstado) {
      const misionHTML = `
        <li class="tarjeta-mision" data-nombre="${mision.name}">
          <h3 class="nombre-mision">${mision.name}</h3>
          <p><strong>Fecha:</strong> ${fecha.toLocaleDateString()}</p>
          <p><strong>Éxito:</strong> ${mision.success ? "✅" : "❌"}</p>
          <p><a href="${mision.links.webcast}" target="_blank">Ver Lanzamiento 🎥</a></p>
        </li>
      `;
      contenedor.innerHTML += misionHTML;

      if (mision.launchpad) {
        if (launchpadsCache[mision.launchpad]) {
          agregarMarcador(launchpadsCache[mision.launchpad], mision.name);
        } else {
          fetch(`https://api.spacexdata.com/v4/launchpads/${mision.launchpad}`)
            .then((res) => res.json())
            .then((lugar) => {
              launchpadsCache[mision.launchpad] = lugar;
              agregarMarcador(lugar, mision.name);
            });
        }
      }
    }
  });
}

function agregarMarcador(lugar, nombreMision) {
  const marcador = L.marker([lugar.latitude, lugar.longitude])
    .bindPopup(`<strong>${nombreMision}</strong><br>${lugar.name}`);

  marcador.addTo(mapa);
  marcadoresActuales.push({ nombre: nombreMision.toLowerCase(), marcador });
}

function filtrarMisionesPorNombre() {
  const input = document.getElementById('buscador').value.trim().toLowerCase();
  const contenedor = document.getElementById('misiones');
  const misiones = contenedor.getElementsByClassName('tarjeta-mision');

  let coincidencias = 0;

  for (let i = 0; i < misiones.length; i++) {
    const mision = misiones[i];
    const nombre = mision.getAttribute("data-nombre").toLowerCase();

    if (input && nombre === input) {
      mision.style.display = '';
      coincidencias++;
    } else {
      mision.style.display = 'none';
    }
  }

  // Mostrar solo el marcador si hay coincidencia exacta
  marcadoresActuales.forEach(obj => {
    if (input && obj.nombre === input) {
      mapa.addLayer(obj.marcador);
    } else {
      mapa.removeLayer(obj.marcador);
    }
  });

  // Si no hay coincidencias, limpiar mapa
  if (!input || coincidencias === 0) {
    marcadoresActuales.forEach(obj => mapa.removeLayer(obj.marcador));
  }
}

window.onload = cargarMisiones;
