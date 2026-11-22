"use strict";

document.addEventListener("scarlette:sesion-verificada", evento => {
  if (!["usuario", "administradora", "administrador"].includes(evento.detail?.usuario?.rol) || document.getElementById("last-movement")) return;
  const panel = document.getElementById("user-monitoring-panel");
  if (!panel) return;
  const card = document.createElement("section");
  card.id = "last-movement";
  card.className = "last-movement";
  card.tabIndex = 0;
  card.setAttribute("aria-labelledby", "last-movement-title");
  const title = document.createElement("h2");
  title.id = "last-movement-title";
  title.className = "card-heading m-0 mb-2 pb-2";
  title.style.fontSize = "16px";
  title.innerHTML = `
    <div class="d-flex justify-content-between align-items-center w-100">
      <span class="d-flex align-items-center gap-2">
        <svg class="icon" style="width:20px;height:20px;color:var(--pink-light)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <span>Último movimiento</span>
      </span>
      <span id="last-movement-unit-label" class="badge-scarlette-usuario" style="font-size:11px">Unidad #${window.SCARLETTE_CONFIG?.VEHICLE_ID || 1}</span>
    </div>
  `;

  const status = document.createElement("p");
  status.className = "last-movement-status small py-1 my-1";
  status.setAttribute("role", "status");
  const fields = document.createElement("dl");
  fields.className = "last-movement-fields my-2";
  const values = ["Comando", "Código", "Fecha y hora de actualización"].map(label => {
    const group = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const value = document.createElement("dd");
    group.append(term, value);
    fields.append(group);
    return value;
  });
  const note = document.createElement("p");
  note.className = "last-movement-note text-muted small mt-auto pt-2";
  note.style.fontSize = "11px";
  note.textContent = "Registro persistido en Amazon RDS MySQL; confirma recepción por la API";
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "outline-button-sm last-movement-retry mt-2";
  retry.style.width = "auto";
  retry.textContent = "↻ Reintentar estado";
  retry.addEventListener("click", () => window.SCARLETTE_CONNECTIONS.solicitarActualizacion());
  card.append(title, status, fields, note, retry);
  panel.prepend(card);

  document.addEventListener("scarlette:panel-cambiado", ev => {
    const vId = window.SCARLETTE_CONFIG?.VEHICLE_ID || 1;
    const lbl = document.getElementById("last-movement-unit-label");
    if (lbl) lbl.textContent = `Unidad #${vId}`;
  });

  function render(snapshot) {
    const data = snapshot.datos;
    const hasMovement = Boolean(data && (data.comando || data.codigo || data.fecha_actualizacion));
    fields.hidden = !hasMovement;
    values[0].textContent = data?.comando || "—";
    values[1].innerHTML = `<span class="badge" style="background:#2a1a2b; border:1px solid #614765; color:var(--pink-light); font-size:11px; padding:2px 6px">${data?.codigo || '—'}</span>`;
    values[2].textContent = (data?.fecha_actualizacion || "—").replace(/^(\d{4}-\d{2}-\d{2})T(?=\d{2}:)/, "$1 ");
    retry.hidden = snapshot.estado !== "error";
    card.dataset.state = snapshot.estado;
    status.textContent = snapshot.estado === "loading" ?
      (hasMovement ? "Actualizando registro…" : "Consultando estado…") :
      snapshot.estado === "error" ?
        (hasMovement ? "Registro no actualizado. Se conserva el último dato válido." : "No se pudo obtener el estado.") +
          (snapshot.http ? ` HTTP ${snapshot.http}.` : "") :
      snapshot.estado === "empty" ? "No hay un movimiento registrado." : "Último registro obtenido de la API.";
  }

  document.addEventListener("scarlette:estado-actualizado", event => render(event.detail));
  document.addEventListener("scarlette:evento-ws", event => {
    if (event.detail?.tipo === "movimiento_individual") {
      window.SCARLETTE_CONNECTIONS.solicitarActualizacion();
    }
  });
  // La consulta compartida puede haber comenzado antes de crear la tarjeta.
  render(window.SCARLETTE_CONNECTIONS.obtenerEstado());
});
