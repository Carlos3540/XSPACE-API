const apiURL = 'https://api.spacexdata.com/v4/launches';
const mapa = L.map('mapa').setView([28.5623, -80.5774], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

const launchpadsCache = {};
const marcadoresActuales = [];

// Favoritos desde localStorage
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

async function cargarMisiones() {
  const anio = document.getElementById("anio").value;
  const estado = document.getElementById("estado").value;
  const nombreInput = document.getElementById("buscador").value.trim().toLowerCase();

  const res = await fetch(apiURL);
  const data = await res.json();

  const contenedor = document.getElementById("listaMisiones");
  contenedor.innerHTML = "";

  mapa.eachLayer((layer) => {
    if (layer instanceof L.Marker) mapa.removeLayer(layer);
  });
  marcadoresActuales.length = 0;

  data.forEach((mision) => {
    const fecha = new Date(mision.date_utc);
    const cumpleAnio = !anio || fecha.getFullYear() == anio;
    const cumpleEstado = estado === "" || mision.success == (estado === "true");
    const cumpleNombre = !nombreInput || mision.name.toLowerCase().includes(nombreInput);

    if (cumpleAnio && cumpleEstado && cumpleNombre) {
      const esFavorita = favoritos.some(fav => fav.id === mision.id);

      const li = document.createElement("li");
      li.className = "tarjeta-mision";

      li.innerHTML = `
        <h3>${mision.name}</h3>
        <p><strong>Fecha:</strong> ${fecha.toLocaleDateString()}</p>
        <p><strong>Éxito:</strong> ${mision.success ? "✅" : "❌"}</p>
        <p><a href="${mision.links.webcast}" target="_blank">Ver Lanzamiento 🎥</a></p>
      `;

      // Estrellita
      const estrella = document.createElement("span");
      estrella.textContent = esFavorita ? "⭐" : "☆";
      estrella.style.cursor = "pointer";
      estrella.style.fontSize = "24px";
      estrella.style.float = "right";
      estrella.className = "estrella";
      estrella.onclick = () => toggleFavorito(mision, estrella);

      li.appendChild(estrella);
      contenedor.appendChild(li);

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
  marcadoresActuales.push(marcador);
}

function toggleFavorito(mision, estrellaElemento) {
  const index = favoritos.findIndex(fav => fav.id === mision.id);
  if (index >= 0) {
    favoritos.splice(index, 1); // Eliminar
    estrellaElemento.textContent = "☆";
  } else {
    favoritos.push({
      id: mision.id,
      name: mision.name,
      date: mision.date_utc,
      success: mision.success,
      webcast: mision.links.webcast
    });
    estrellaElemento.textContent = "⭐";
  }
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

function redirigir(pagina) {
  window.location.href = pagina;
}

window.onload = cargarMisiones;
