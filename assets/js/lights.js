"use strict";

// Indicador visual aislado: no solicita ni confirma cambios fisicos del vehiculo.
window.SCARLETTE_LIGHTS = (() => {
  let paso = null;
  let controlEstimado = "unknown";
  let lucesEstimadas = "unknown";
  let revision = 0;
  let pendientes = 0;
  const observadas = new WeakSet();
  const descripciones = Object.freeze({
    unknown: "Estado de control y luces desconocido. Sin confirmación física del vehículo.",
    control: "Control encendido, estado de luces estimado. Sin confirmación física del vehículo.",
    on: "Control encendido y luces estimadas encendidas. Sin confirmación física del vehículo.",
    off: "Control encendido y luces estimadas apagadas. Sin confirmación física del vehículo."
  });

  function setState(estado) {
    if (!Object.prototype.hasOwnProperty.call(descripciones, estado)) {
      throw new RangeError("Estado de luces inválido: usa unknown, control, on u off.");
    }
    // Probar on/off/control solo cambia la apariencia: no inicia ni borra una
    // estimacion ya confirmada. unknown invalida la referencia (errores incluidos).
    if (estado === "unknown") {
      paso = null;
      controlEstimado = "unknown";
      lucesEstimadas = "unknown";
      revision += 1;
      const confirmacion = document.getElementById("lights-initial-confirmed");
      if (confirmacion) confirmacion.checked = false;
    }
    return mostrar(estado);
  }

  function mostrar(estado) {
    const boton = document.querySelector('.movement[data-command="4"]');
    if (!boton) {
      actualizarConfirmacion();
      return false;
    }

    const descripcion = descripciones[estado];
    const controlActivo = controlEstimado === "active" || estado === "control";
    boton.classList.toggle("control-active", controlActivo);
    boton.classList.toggle("lights-active", estado === "on");
    boton.dataset.controlState = controlActivo ? "active" : controlEstimado;
    boton.dataset.lightsState = estado;
    boton.setAttribute("aria-description", descripcion);
    boton.title = descripcion;

    // Reutiliza la descripción existente sin cambiar etiquetas ni iconos.
    const detalle = document.getElementById("lights-status");
    if (detalle) detalle.textContent = descripcion;
    actualizarConfirmacion();
    return true;
  }

  function actualizarConfirmacion() {
    const casilla = document.getElementById("lights-initial-confirmed");
    const boton = document.getElementById("lights-confirm-initial");
    const estado = document.getElementById("lights-estimation-status");
    if (boton) boton.disabled = !casilla?.checked || pendientes > 0;
    if (estado) {
      estado.textContent = pendientes > 0 ? "Solicitud de luces pendiente…" :
        paso === null ? "Estado desconocido. Confirma el estado inicial para iniciar la estimación." :
        paso === 0 ? "Referencia confirmada. La 1.ª pulsación encenderá control y luces (estimado)." :
        paso === 1 ? "Control y luces encendidos (estimado, sin confirmación física)." :
        lucesEstimadas === "on" ? "Control activo · Luces encendidas (estimado, sin confirmación física)." :
        "Control activo · Luces apagadas (estimado, sin confirmación física).";
    }
  }

  // Solo iniciar tras verificar fisicamente el estado anterior a la primera
  // pulsacion. No basta con observar luces apagadas (hay estados distintos).
  function startEstimation({ initialStateConfirmed = false } = {}) {
    if (initialStateConfirmed !== true || pendientes) return false;
    revision += 1;
    paso = 0;
    controlEstimado = "initial";
    lucesEstimadas = "unknown";
    mostrar("unknown");
    return true;
  }

  function confirmPress() {
    if (paso === null) {
      setState("unknown");
      return;
    }
    paso += 1;
    controlEstimado = "active";
    // Primera pulsacion: control y luces encendidos; las siguientes alternan
    // solo las luces mientras siga siendo valida la referencia fisica inicial.
    lucesEstimadas = lucesEstimadas === "on" ? "off" : "on";
    mostrar(lucesEstimadas);
  }

  // Solo lectura: el estado visual manual no equivale a una estimacion fisica.
  function getEstimatedState() {
    return Object.freeze({ control: controlEstimado, lights: lucesEstimadas, step: paso });
  }

  // Observa la peticion ya enviada por controls.js; no crea ni repite comandos.
  function observeRequest(peticion) {
    if (observadas.has(peticion)) return;
    observadas.add(peticion);
    const referencia = revision;
    pendientes += 1;
    actualizarConfirmacion();
    void Promise.resolve(peticion).then(() => {
      pendientes -= 1;
      if (referencia === revision) confirmPress();
      else actualizarConfirmacion();
    }, () => {
      pendientes -= 1;
      setState("unknown");
    });
  }

  // panel.html carga este script después del marcado del botón.
  setState("unknown");
  document.getElementById("lights-initial-confirmed")?.addEventListener("change", actualizarConfirmacion);
  document.getElementById("lights-estimation-form")?.addEventListener("submit", evento => {
    evento.preventDefault();
    const casilla = document.getElementById("lights-initial-confirmed");
    if (!casilla?.checked || !startEstimation({ initialStateConfirmed: true })) return;
    casilla.checked = false;
    actualizarConfirmacion();
    const panel = document.getElementById("lights-estimation");
    if (panel) panel.open = false;
  });
  return Object.freeze({ setState, startEstimation, confirmPress, observeRequest, getEstimatedState });
})();
