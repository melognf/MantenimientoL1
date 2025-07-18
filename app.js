import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, setDoc,
  onSnapshot, collection
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAXHDX9ahStXfii-TZYw7rk1UmsCozrjpo",
  authDomain: "mantenimientol1.firebaseapp.com",
  projectId: "mantenimientol1",
  storageBucket: "mantenimientol1.firebasestorage.app",
  messagingSenderId: "775480597409",
  appId: "1:775480597409:web:f6306ef3b5aaf92a6689e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function calcularEstado(tareas) {
  const hayGraves = tareas.some(t => !t.resuelta && t.grave);
  const hayPendientes = tareas.some(t => !t.resuelta);
  if (hayGraves) return "rojo";
  if (hayPendientes) return "amarillo";
  return "verde";
}

// Lista de máquinas
const maquinas = [
  "llenadora", "cooler", "etiquetadora",
  "empacadora", "paletizadora", "envolvedora", "transportes"
];

const container = document.getElementById("maquinasContainer");

// Renderiza cada máquina
maquinas.forEach(nombre => {
  const div = document.createElement("div");
  div.id = nombre;
  div.className = "maquina";
  div.innerHTML = `
    <h2>${nombre.toUpperCase()}</h2>
    <div class="estado">Cargando estado...</div>
    <div class="tareas"></div>
    <input type="text" placeholder="Nueva tarea..." />
    <div class="botones">
      <button class="agregar">Agregar Tarea</button>
      <button class="problema">Problema Grave</button>
      <button class="liberar">Liberar Máquina</button>
    </div>
  `;
  container.appendChild(div);

  const docRef = doc(db, "maquinas", nombre);

  // Escucha en tiempo real
  onSnapshot(docRef, snapshot => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const estado = data.estado;
    const tareas = data.tareas || [];

    div.className = "maquina " + estado;
    div.querySelector(".estado").innerText = "Estado: " + estado.toUpperCase();

    const tareasDiv = div.querySelector(".tareas");
    tareasDiv.innerHTML = tareas.map(t =>
  `<div class="tarea">
    <span>${t.descripcion}</span>
    <div>
      ${!t.resuelta 
        ? `<button class="solucionar${t.grave ? ' grave' : ''}" data-id="${t.id}">Solucionar</button>`  
        : `<span class="resuelta">✅</span>`}
      <button class="eliminar" data-id="${t.id}">🗑️</button>
    </div>
  </div>`
   ).join("");


    tareasDiv.querySelectorAll("button.solucionar").forEach(btn => {
  btn.onclick = async () => {
    const tareaId = btn.dataset.id;
    const nuevasTareas = tareas.map(t => 
      t.id === tareaId ? { ...t, resuelta: true } : t
    );
    const hayGrave = nuevasTareas.some(t => !t.resuelta && t.grave);
    const hayPendientes = nuevasTareas.some(t => !t.resuelta);
    await setDoc(docRef, {
  ...data,
  tareas: nuevasTareas,
  estado: calcularEstado(nuevasTareas),
  ultimaActualizacion: Date.now()
});


  };
});

tareasDiv.querySelectorAll("button.eliminar").forEach(btn => {
  btn.onclick = async () => {
    const tareaId = btn.dataset.id;
    const nuevasTareas = tareas.filter(t => t.id !== tareaId);
    const hayGrave = nuevasTareas.some(t => !t.resuelta && t.grave);
const hayPendientes = nuevasTareas.some(t => !t.resuelta);
await updateDoc(docRef, {
  tareas: nuevasTareas,
  estado: hayGrave ? "rojo" : hayPendientes ? "amarillo" : "verde"
});

  };
});

  });

  // Agregar tarea
  div.querySelector(".agregar").onclick = async () => {
    const input = div.querySelector("input");
    const texto = input.value.trim();
    if (!texto) return;

    const snap = await getDoc(docRef);
    const data = snap.exists() ? snap.data() : { tareas: [], estado: "verde" };
    const nuevasTareas = [...(data.tareas || []), {
      id: crypto.randomUUID(),
      descripcion: texto,
      resuelta: false
    }];
    await setDoc(docRef, {
  ...data,
  tareas: nuevasTareas,
  estado: calcularEstado(nuevasTareas),
  ultimaActualizacion: Date.now()
});

    input.value = "";
  };

  // Reportar problema grave
  div.querySelector(".problema").onclick = async () => {
  const descripcion = prompt("Describa el problema grave:");
  if (!descripcion || !descripcion.trim()) return;

  const snap = await getDoc(docRef);
  const data = snap.exists() ? snap.data() : { tareas: [], estado: "verde" };
  const nuevasTareas = [...(data.tareas || []), {
    id: crypto.randomUUID(),
    descripcion: descripcion.trim(),
    resuelta: false,
    grave: true
  }];
  await updateDoc(docRef, {
    ...data,
    tareas: nuevasTareas,
    estado: calcularEstado(nuevasTareas),

    ultimaActualizacion: Date.now()
  });
};



  // Liberar manualmente
  div.querySelector(".liberar").onclick = async () => {
    await updateDoc(docRef, {
      estado: "verde",
      tareas: [],
      ultimaActualizacion: Date.now()
    });
  };
});
