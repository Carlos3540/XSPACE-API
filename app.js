const apiURL = 'https://api.spacexdata.com/v4/launches';
const mapa = L.map('mapa').setView([28.5623, -80.5774], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

const launchpadsCache = {};

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

  data.forEach((mision) => {
    const fecha = new Date(mision.date_utc);
    const cumpleAnio = !anio || fecha.getFullYear() == anio;
    const cumpleEstado = estado === "" || mision.success == (estado === "true");

    if (cumpleAnio && cumpleEstado) {
      const misionHTML = `
        <li class="mision">
          <h3>${mision.name}</h3>
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
  L.marker([lugar.latitude, lugar.longitude])
    .addTo(mapa)
    .bindPopup(`<strong>${nombreMision}</strong><br>${lugar.name}`);
}

window.onload = cargarMisiones;
