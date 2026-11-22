"use strict";

document.addEventListener("scarlette:sesion-verificada", evento => {
  if (!["usuario", "administradora", "administrador"].includes(evento.detail?.usuario?.rol) || document.getElementById("movement-history")) return;
  const panel = document.getElementById("user-monitoring-panel");
  if (!panel) return;

  const section = document.createElement("section");
  section.id = "movement-history";
  section.className = "movement-history";
  section.setAttribute("aria-labelledby", "movement-history-title");
  const heading = document.createElement("h2");
  heading.id = "movement-history-title";
  heading.className = "card-heading m-0 mb-2 pb-2";
  heading.style.fontSize = "16px";
  heading.innerHTML = `
    <div class="d-flex justify-content-between align-items-center w-100">
      <span class="d-flex align-items-center gap-2">
        <svg class="icon" style="width:20px;height:20px;color:var(--pink-light)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
        <span>Historial (10 movimientos)</span>
      </span>
      <span id="history-unit-label" class="badge-scarlette-vendido" style="font-size:11px">Unidad #${window.SCARLETTE_CONFIG?.VEHICLE_ID || 1}</span>
    </div>
  `;

  const note = document.createElement("p");
  note.className = "history-note text-muted small my-1";
  note.style.fontSize = "11px";
  note.textContent = "Últimos 10 movimientos registrados en AWS RDS MySQL en orden cronológico descendente.";
  const status = document.createElement("p");
  status.className = "history-status small py-1 my-0";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = "El historial se consultará al abrir MONITOREO.";
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "outline-button-sm history-retry mb-2";
  retry.textContent = "↻ Reintentar consulta";
  retry.hidden = true;
  const scroll = document.createElement("div");
  scroll.className = "history-table-scroll";
  scroll.tabIndex = 0;
  scroll.setAttribute("role", "region");
  scroll.setAttribute("aria-label", "Tabla de movimientos; desplazamiento horizontal disponible");
  scroll.hidden = true;
  const table = document.createElement("table");
  table.className = "history-table";
  const caption = document.createElement("caption");
  caption.className = "visually-hidden";
  caption.textContent = "Movimientos individuales, del más reciente al más antiguo";
  const header = table.createTHead().insertRow();
  ["Movimiento", "Código", "Fecha y hora", "Origen"].forEach(label => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    header.append(th);
  });
  table.prepend(caption);
  const body = table.createTBody();
  scroll.append(table);
  section.append(heading, note, status, retry, scroll);
  panel.append(section);

  let visited = false;
  let active = true;
  let inFlight = false;
  let dirty = false;
  let timer = null;
  const GROUP_DELAY = 500;

  function schedule() {
    dirty = true;
    if (!active || !visited || inFlight || timer !== null) return;
    // Ventana fija: una ráfaga no crea peticiones por cada evento.
    timer = setTimeout(() => {
      timer = null;
      void load();
    }, GROUP_DELAY);
  }

  async function load() {
    if (!active || inFlight) return;
    inFlight = true;
    dirty = false;
    retry.hidden = true;
    status.textContent = "Consultando historial…";
    scroll.setAttribute("aria-busy", "true");
    try {
      const records = await window.SCARLETTE_API.solicitar(
        `/vehiculos/${window.SCARLETTE_CONFIG.VEHICLE_ID}/historial`,
        { method: "GET" }
      );
      if (!active) return;
      if (!Array.isArray(records) || records.some(record => !record || typeof record !== "object" || Array.isArray(record))) {
        throw new Error("Formato de historial no válido.");
      }
      const rows = document.createDocumentFragment();
      // El orden y la exclusión de pasos DEMO corresponden al contrato REST.
      records.slice(0, 10).forEach(record => {
        const row = document.createElement("tr");
        const fullDate = String(record.fecha_hora ?? "—").replace(/^(\d{4}-\d{2}-\d{2})T(?=\d{2}:)/, "$1 ");
        const shortDate = fullDate.replace(/^\d{4}-/, '');
        
        const tdCmd = document.createElement("td");
        tdCmd.innerHTML = `<strong style="color:#ffffff; font-size:10px; line-height:1.1">${record.comando || '—'}</strong>`;
        
        const tdCod = document.createElement("td");
        tdCod.innerHTML = `<span class="badge" style="background:#2a1a2b; border:1px solid #614765; color:var(--pink-light); font-size:9px; padding:1px 4px">${record.codigo || '—'}</span>`;
        
        const tdDate = document.createElement("td");
        tdDate.innerHTML = `<span title="${fullDate}" style="color:#d5cbe0; font-family:monospace; font-size:9.5px; white-space:nowrap">${shortDate}</span>`;
        
        const origText = (record.origen === "scarlette_web" || !record.origen) ? "web" : record.origen;
        const tdOrig = document.createElement("td");
        tdOrig.innerHTML = `<span class="badge-scarlette-usuario" title="${record.origen || 'web'}" style="padding:1px 5px; font-size:8.5px; white-space:nowrap">${origText}</span>`;
        
        row.append(tdCmd, tdCod, tdDate, tdOrig);
        rows.append(row);
      });
      body.replaceChildren(rows);
      scroll.hidden = body.rows.length === 0;
      status.textContent = body.rows.length ? `${body.rows.length} movimientos recientes cargados.` : "No hay movimientos individuales registrados.";
    } catch (error) {
      if (!active) return;
      status.textContent = `No se pudo consultar el historial${error.status ? ` (HTTP ${error.status})` : ""}.` +
        (body.rows.length ? " Los datos visibles corresponden a la consulta anterior." : "");
      retry.hidden = false;
    } finally {
      inFlight = false;
      scroll.setAttribute("aria-busy", "false");
      if (active && dirty) schedule();
    }
  }

  retry.addEventListener("click", () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    void load();
  });
  document.addEventListener("scarlette:panel-cambiado", event => {
    const vId = window.SCARLETTE_CONFIG?.VEHICLE_ID || 1;
    const lbl = document.getElementById("history-unit-label");
    if (lbl) lbl.textContent = `Unidad #${vId}`;
    if (event.detail?.panel === "monitoring" || event.detail?.vehiculoId) {
      visited = false;
      void load();
    }
  });
  document.addEventListener("scarlette:evento-ws", event => {
    if (event.detail?.tipo === "movimiento_individual") schedule();
  });
  window.addEventListener("pagehide", () => {
    active = false;
    if (timer !== null) clearTimeout(timer);
  });
});
