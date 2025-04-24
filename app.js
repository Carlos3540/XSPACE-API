/**
 * Aplicación SpaceX - Carga y gestiona las misiones espaciales
 * Desarrollado por Carlos Riaño
 */

// Constantes y variables globales
const apiURL = 'https://api.spacexdata.com/v4/launches';
const launchpadsCache = {}; // Cache para almacenar información de plataformas de lanzamiento
let marcadoresActuales = []; // Registro de marcadores en el mapa
let favoritos = []; // Lista de misiones favoritas

// Inicializar el mapa con Leaflet
const mapa = L.map('mapa').setView([28.5623, -80.5774], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

// Función para cargar las misiones desde la API
async function cargarMisiones() {
  try {
    // Obtener valores de los filtros
    const anio = document.getElementById("anio").value;
    const estado = document.getElementById("estado").value;
    const nombreInput = document.getElementById("buscador").value.trim().toLowerCase();
    
    // Obtener datos de la API
    const res = await fetch(apiURL);
    if (!res.ok) {
      throw new Error('Error al cargar datos de la API SpaceX');
    }
    
    const data = await res.json();
    const contenedor = document.getElementById("listaMisiones");
    contenedor.innerHTML = ""; // Limpiar contenedor
    
    // Limpiar marcadores anteriores del mapa
    mapa.eachLayer(layer => {
      if (layer instanceof L.Marker) mapa.removeLayer(layer);
    });
    
    // Cargar favoritos desde localStorage
    favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    
    // Filtrar y mostrar misiones
    data.forEach((mision) => {
      const fecha = new Date(mision.date_utc);
      const cumpleAnio = !anio || fecha.getFullYear() == anio;
      const cumpleEstado = estado === "" || mision.success == (estado === "true");
      const cumpleNombre = !nombreInput || mision.name.toLowerCase().includes(nombreInput);
      
      // Aplicar filtros
      if (cumpleAnio && cumpleEstado && cumpleNombre) {
        mostrarMision(mision, contenedor);
        mostrarLugarLanzamiento(mision);
      }
    });
  } catch (error) {
    console.error("Error en cargarMisiones:", error);
    document.getElementById("listaMisiones").innerHTML = 
      `<li class="tarjeta-mision"><p>Error al cargar misiones: ${error.message}</p></li>`;
  }
}

// Función para mostrar una misión en la lista
function mostrarMision(mision, contenedor) {
  const fecha = new Date(mision.date_utc);
  const esFavorita = favoritos.some(fav => fav.id === mision.id);
  
  // Crear elemento de lista para la misión
  const li = document.createElement("li");
  li.className = "tarjeta-mision";
  
  // Contenido HTML con datos de la misión
  li.innerHTML = `
    <h3>${mision.name}</h3>
    <p><strong>Fecha:</strong> ${fecha.toLocaleDateString()}</p>
    <p><strong>Éxito:</strong> ${mision.success ? "✅" : "❌"}</p>
    <p><a href="${mision.links.webcast}" target="_blank">Ver Lanzamiento 🎥</a></p>
  `;
  
  // Agregar botón de favorito
  const estrella = document.createElement("span");
  estrella.textContent = esFavorita ? "⭐" : "☆";
  estrella.className = "estrella";
  estrella.onclick = () => toggleFavorito(mision, estrella);
  
  li.appendChild(estrella);
  contenedor.appendChild(li);
}

// Función para mostrar lugar de lanzamiento en el mapa
async function mostrarLugarLanzamiento(mision) {
  if (!mision.launchpad) return;
  
  try {
    // Usar cache si está disponible para reducir solicitudes API
    if (launchpadsCache[mision.launchpad]) {
      agregarMarcador(launchpadsCache[mision.launchpad], mision.name);
    } else {
      // Cargar datos de la plataforma si no está en cache
      const response = await fetch(`https://api.spacexdata.com/v4/launchpads/${mision.launchpad}`);
      if (!response.ok) throw new Error('Error al cargar datos del launchpad');
      
      const lugar = await response.json();
      launchpadsCache[mision.launchpad] = lugar;
      agregarMarcador(lugar, mision.name);
    }
  } catch (error) {
    console.error(`Error al cargar lugar de lanzamiento para ${mision.name}:`, error);
  }
}

// Función para agregar marcador al mapa
function agregarMarcador(lugar, nombreMision) {
  // Verificar que tiene coordenadas válidas
  if (!lugar.latitude || !lugar.longitude) return;
  
  const marcador = L.marker([lugar.latitude, lugar.longitude])
    .bindPopup(`<strong>${nombreMision}</strong><br>${lugar.name}`);
  
  marcador.addTo(mapa);
  marcadoresActuales.push(marcador);
}

// Función para toggle (añadir/quitar) favorito
function toggleFavorito(mision, estrellaElemento) {
  // Buscar si ya existe como favorito
  const index = favoritos.findIndex(fav => fav.id === mision.id);
  
  if (index >= 0) {
    // Quitar de favoritos
    favoritos.splice(index, 1);
    estrellaElemento.textContent = "☆";
  } else {
    // Agregar a favoritos
    favoritos.push({
      id: mision.id,
      name: mision.name,
      date: mision.date_utc,
      success: mision.success,
      webcast: mision.links.webcast
    });
    estrellaElemento.textContent = "⭐";
  }
  
  // Guardar en localStorage para persistencia
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  
  // Si estamos en la sección de favoritos, actualizar la vista
  const seccionFavoritos = document.getElementById('favoritos');
  if (seccionFavoritos.style.display === 'block') {
    cargarFavoritos();
  }
}

// Función para cargar y mostrar favoritos
function cargarFavoritos() {
  // Cargar favoritos desde localStorage
  favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
  const contenedor = document.getElementById("listaFavoritos");
  contenedor.innerHTML = "";
  
  if (favoritos.length === 0) {
    contenedor.innerHTML = `<p class="tarjeta-mision">No tienes misiones favoritas guardadas.</p>`;
    return;
  }
  
  // Mostrar cada favorito
  favoritos.forEach(favorito => {
    const fecha = new Date(favorito.date);
    const li = document.createElement("li");
    li.className = "tarjeta-mision";
    
    li.innerHTML = `
      <h3>${favorito.name}</h3>
      <p><strong>Fecha:</strong> ${fecha.toLocaleDateString()}</p>
      <p><strong>Éxito:</strong> ${favorito.success ? "✅" : "❌"}</p>
      <p><a href="${favorito.webcast}" target="_blank">Ver Lanzamiento 🎥</a></p>
    `;
    
    // Agregar botón para eliminar de favoritos
    const eliminar = document.createElement("span");
    eliminar.textContent = "❌";
    eliminar.style.cursor = "pointer";
    eliminar.className = "estrella";
    eliminar.title = "Eliminar de favoritos";
    eliminar.onclick = () => {
      const index = favoritos.findIndex(fav => fav.id === favorito.id);
      if (index >= 0) {
        favoritos.splice(index, 1);
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
        cargarFavoritos(); // Recargar la lista
      }
    };
    
    li.appendChild(eliminar);
    contenedor.appendChild(li);
  });
}

// Inicializar la aplicación cuando se carga la página
window.onload = function() {
  cargarMisiones();
  // Carga favoritos del localStorage
  favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
};
