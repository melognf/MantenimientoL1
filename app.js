import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, updateDoc, setDoc, onSnapshot, setLogLevel
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Configuración Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAXHDX9ahStXfii-TZYw7rk1UmsCozrjpo",
  authDomain: "mantenimientol1.firebaseapp.com",
  projectId: "mantenimientol1",
  storageBucket: "mantenimientol1.firebasestorage.app",
  messagingSenderId: "775480597409",
  appId: "1:775480597409:web:f6306ef3b5aaf92a6689e0"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);
setLogLevel("debug"); // logs de Firestore en consola

// --- Helpers ---
function calcularEstado(tareas) {
  const hayGraves     = tareas.some(t => !t.resuelta && t.grave);
  const hayPendientes = tareas.some(t => !t.resuelta);
  if (hayGraves) return "rojo";
  if (hayPendientes) return "amarillo";
  return "verde";
}

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

    btnSi.onclick = () => { cerrar(); resolve(true); };
    btnNo.onclick = () => { cerrar(); resolve(false); };
  });
}

// --- Lista de máquinas ---
const maquinas = ["llenadora","cooler","etiquetadora","empacadora","paletizadora","envolvedora","transportes"];
const container = document.getElementById("maquinasContainer");

// =====================
//  Autenticación + arranque
// =====================
signInAnonymously(auth).catch(console.error);
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  console.log("UID listo:", user.uid);
  startApp();
});

function startApp() {
  // Render por máquina
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

    // Listener en tiempo real con manejo de error
    onSnapshot(
      docRef,
      async (snapshot) => {
        const data   = snapshot.exists() ? snapshot.data() : { estado: "verde", tareas: [] };
        const estado = data.estado;
        const tareas = data.tareas || [];

        div.className = "maquina " + estado;
        div.querySelector(".estado-texto").innerText = "Estado: " + estado.toUpperCase();

        const circulo = div.querySelector(".estado-circulo");
        circulo.className = "estado-circulo " + estado;

        const tareasDiv = div.querySelector(".tareas");
        tareasDiv.innerHTML = "";

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
          const detalleTextarea = document.createElement("textarea");
          detalleTextarea.placeholder = "Detalle...";
          detalleTextarea.rows = 3;
          detalleTextarea.style.width = "100%";
          detalleTextarea.style.marginTop = "5px";
          detalleTextarea.style.overflowY = "hidden";
          detalleTextarea.style.resize = "none";
          detalleTextarea.style.boxSizing = "border-box";
          detalleTextarea.value = t.detalle || "";

          // Auto-ajuste
          const autoResize = () => {
            detalleTextarea.style.height = "auto";
            detalleTextarea.style.height = detalleTextarea.scrollHeight + "px";
          };
          detalleTextarea.addEventListener("input", autoResize);
          setTimeout(autoResize, 0);

          tareaDiv.appendChild(detalleTextarea);

          // Botón guardar detalle
          const guardarBtn = document.createElement("button");
          guardarBtn.textContent = "Guardar detalle";
          guardarBtn.style.marginTop = "5px";
          guardarBtn.title = "Guardar detalle";
          guardarBtn.style.backgroundColor = "#3d3939ff";
          tareaDiv.appendChild(guardarBtn);

          // Contenedor de botones
          const botonesDiv = document.createElement("div");
          botonesDiv.style.marginTop = "5px";

          if (!t.resuelta) {
            const solucionarBtn = document.createElement("button");
            solucionarBtn.textContent = "Solucionado";
            solucionarBtn.classList.add("solucionar");
            if (t.grave) solucionarBtn.classList.add("grave");
            solucionarBtn.dataset.id = t.id;
            botonesDiv.appendChild(solucionarBtn);

            // Marcar como resuelta
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
          eliminarBtn.className = "eliminar";
          eliminarBtn.style.backgroundColor = "transparent";
          eliminarBtn.style.border = "none";
          eliminarBtn.style.fontSize = "12px";
          eliminarBtn.style.cursor = "pointer";
          eliminarBtn.style.color = "red";
          botonesDiv.appendChild(eliminarBtn);

          eliminarBtn.onclick = async () => {
            const seguro = await mostrarConfirmacion("¿Estás seguro de eliminar esta tarea?");
            if (!seguro) return;
            const nuevasTareas = tareas.filter(task => task.id !== t.id);
            await setDoc(docRef, {
              ...data,
              tareas: nuevasTareas,
              estado: calcularEstado(nuevasTareas),
              ultimaActualizacion: Date.now()
            });
          };

          tareaDiv.appendChild(botonesDiv);

          // Guardar detalle
          guardarBtn.onclick = async () => {
            const nuevoDetalle = detalleTextarea.value;
            const nuevasTareas = tareas.map(task =>
              task.id === t.id ? { ...task, detalle: nuevoDetalle } : task
            );
            await setDoc(docRef, {
              ...data,
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
      },
      (err) => {
        // Evitar quedar en "Cargando..."
        const estadoTxt = div.querySelector(".estado-texto");
        if (estadoTxt) estadoTxt.innerText = "Sin permiso para leer";
        console.error(`Snapshot ${nombre}:`, err.code, err.message);
      }
    );

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
        detalle: "",
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
        detalle: "",
        resuelta: false,
        grave: true
      }];

      await setDoc(docRef, {
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

      await setDoc(docRef, {
        estado: "verde",
        tareas: [],
        ultimaActualizacion: Date.now()
      });
    };
  });

  // (Extra) Si tenés textareas estáticos en el HTML:
  document.querySelectorAll("textarea").forEach(textarea => {
    textarea.style.overflowY = "hidden";
    textarea.style.resize = "none";
    const autoResize = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };
    textarea.addEventListener("input", autoResize);
    setTimeout(autoResize, 0);
  });
}
