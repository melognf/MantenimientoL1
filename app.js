import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, setDoc,
  onSnapshot
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
    <div class="estado">
  <span class="estado-circulo"></span>
  <span class="estado-texto">Cargando estado...</span>
</div>

    <div class="tareas"></div>
    <input type="text" placeholder="Nueva tarea..." />
    <div class="botones">
      <button class="agregar">Agregar Tarea</button>
      <button class="problema">Falla crìtica</button>
      <button class="liberar">Liberar Máquina</button>
    </div>
  `;
  container.appendChild(div);

  const docRef = doc(db, "maquinas", nombre);

  // Escucha en tiempo real
  onSnapshot(docRef, async snapshot => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const estado = data.estado;
    const tareas = data.tareas || [];

    div.className = "maquina " + estado;
    div.querySelector(".estado-texto").innerText = "Estado: " + estado.toUpperCase();

const circulo = div.querySelector(".estado-circulo");
circulo.className = "estado-circulo " + estado; // le damos clase según el estado


    const tareasDiv = div.querySelector(".tareas");
    tareasDiv.innerHTML = ""; // limpio el contenedor

    tareas.forEach(t => {
      const tareaDiv = document.createElement("div");
      tareaDiv.classList.add("tarea");
      tareaDiv.dataset.id = t.id;

      // Descripción
      const descripcionSpan = document.createElement("span");
      descripcionSpan.style.fontWeight = "bold";
      descripcionSpan.textContent = t.descripcion;
      tareaDiv.appendChild(descripcionSpan);

      // Textarea detalle
      // Textarea detalle
const detalleTextarea = document.createElement("textarea");
detalleTextarea.placeholder = "Detalle...";
detalleTextarea.rows = 3;
detalleTextarea.style.width = "100%";
detalleTextarea.style.marginTop = "5px";
detalleTextarea.style.overflowY = "hidden";
detalleTextarea.style.resize = "none";
detalleTextarea.style.boxSizing = "border-box";
detalleTextarea.value = t.detalle || "";

// Autoajuste al escribir
detalleTextarea.addEventListener("input", () => {
  detalleTextarea.style.height = "auto";
  detalleTextarea.style.height = detalleTextarea.scrollHeight + "px";
});

// Autoajuste inicial
setTimeout(() => {
  detalleTextarea.style.height = "auto";
  detalleTextarea.style.height = detalleTextarea.scrollHeight + "px";
}, 0);

tareaDiv.appendChild(detalleTextarea);

      // Botón guardar detalle
      const guardarBtn = document.createElement("button");
      guardarBtn.textContent = "Guardar detalle";
      guardarBtn.style.marginTop = "5px";
      guardarBtn.title = "Guardar detalle";
      guardarBtn.style.backgroundColor = "#3d3939ff"; // gris medio


      tareaDiv.appendChild(guardarBtn);

      // Contenedor botones solucionar/eliminar
      const botonesDiv = document.createElement("div");
      botonesDiv.style.marginTop = "5px";

      if (!t.resuelta) {
     const solucionarBtn = document.createElement("button");
     solucionarBtn.textContent = "Solucionado";

        solucionarBtn.classList.add("solucionar");
        if (t.grave) solucionarBtn.classList.add("grave");
        solucionarBtn.dataset.id = t.id;
        botonesDiv.appendChild(solucionarBtn);

        // Listener solucionar
        solucionarBtn.onclick = async () => {
          const nuevasTareas = tareas.map(task =>
            task.id === t.id ? { ...task, resuelta: true } : task
          );
          await setDoc(docRef, {
            ...data,
            tareas: nuevasTareas,
            estado: calcularEstado(nuevasTareas),
            ultimaActualizacion: Date.now()
          });
        };
      } else {
        const resueltaSpan = document.createElement("span");
        resueltaSpan.classList.add("resuelta");
        resueltaSpan.textContent = "✅";
        botonesDiv.appendChild(resueltaSpan);
      }

      // Botón eliminar
      const eliminarBtn = document.createElement("button");
eliminarBtn.innerHTML = "❌ <span style='margin-left:5px;'>Quitar</span>";

eliminarBtn.dataset.id = t.id;
eliminarBtn.className = "eliminar"; // usá la clase para darle estilo

      eliminarBtn.dataset.id = t.id;
      eliminarBtn.style.backgroundColor = "transparent";
eliminarBtn.style.border = "none";
eliminarBtn.style.fontSize = "12 px";
eliminarBtn.style.cursor = "pointer";
eliminarBtn.style.color = "red"; // o negro
      botonesDiv.appendChild(eliminarBtn);

      eliminarBtn.onclick = async () => {
  const seguro = await mostrarConfirmacion("¿Estás seguro de eliminar esta tarea?");
  if (!seguro) return;

  const nuevasTareas = tareas.filter(task => task.id !== t.id);
  await updateDoc(docRef, {
    tareas: nuevasTareas,
    estado: calcularEstado(nuevasTareas),
    ultimaActualizacion: Date.now()
  });
};




      tareaDiv.appendChild(botonesDiv);

      // Listener guardar detalle
      guardarBtn.onclick = async () => {
        const nuevoDetalle = detalleTextarea.value;
        const nuevasTareas = tareas.map(task =>
          task.id === t.id ? { ...task, detalle: nuevoDetalle } : task
        );
        await updateDoc(docRef, {
          tareas: nuevasTareas,
          estado: calcularEstado(nuevasTareas),
          ultimaActualizacion: Date.now()
        });
        guardarBtn.textContent = "✅ Guardado";
        guardarBtn.disabled = true;
        setTimeout(() => {
          guardarBtn.textContent = "Guardar detalle";
          guardarBtn.disabled = false;
        }, 1500);
      };

      tareasDiv.appendChild(tareaDiv);
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
      detalle: "", // importante incluir detalle vacío
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
      detalle: "", // también detalle vacío
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
  const seguro = await mostrarConfirmacion("¿Estás seguro de borrar todas las tareas?");
  if (!seguro) return;

  await updateDoc(docRef, {
    estado: "verde",
    tareas: [],
    ultimaActualizacion: Date.now()
  });
};


function mostrarConfirmacion(mensaje) {
  return new Promise(resolve => {
    const modal = document.getElementById("modalConfirmacion");
    const mensajeElem = document.getElementById("mensajeConfirmacion");
    const btnSi = document.getElementById("btnSi");
    const btnNo = document.getElementById("btnNo");

    mensajeElem.textContent = mensaje;
    modal.style.display = "flex";

    const cerrar = () => {
      modal.style.display = "none";
      btnSi.onclick = null;
      btnNo.onclick = null;
    };

    btnSi.onclick = () => {
      cerrar();
      resolve(true);
    };
    btnNo.onclick = () => {
      cerrar();
      resolve(false);
    };
  });
}

document.querySelectorAll("textarea").forEach(textarea => {
  textarea.style.overflowY = "hidden";
  textarea.style.resize = "none";

  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });
});


});
