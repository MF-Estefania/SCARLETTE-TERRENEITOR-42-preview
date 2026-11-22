"use strict";

document.addEventListener("scarlette:sesion-verificada", async evento => {
  const usuario = evento.detail?.usuario;
  if (!usuario || document.getElementById("user-panel-tabs")) return;

  const rol = usuario.rol;
  const shell = document.querySelector(".app-shell");

  // Añadir la clase fundamental para activar todos los estilos de navegación de SCARLETTE
  document.body.classList.add("user-navigation");

  // Modo Invitado (demostración temporal en unidad 2)
  if (rol === "invitado") {
    configurarModoInvitado(shell);
    return;
  }

  // 1. Crear el HUD de Vehículo Conectado (Cabina de Control)
  const hud = document.createElement("div");
  hud.id = "vehicle-hud-banner";
  hud.className = "vehicle-hud glass-card mb-3";
  hud.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <div class="hud-icon-box">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 13 8 7h8l3 6M3 13h18v5h-2m-14 0H3v-5m5 5h8M9 10h6"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/></svg>
      </div>
      <div>
        <div class="d-flex align-items-center flex-wrap gap-2">
          <span class="hud-title">Unidad Conectada:</span>
          <span id="hud-unit-name" class="hud-name">#1 Terreneitor TR-01</span>
          <span id="hud-unit-badge" class="badge-scarlette-vendido">Vendido · Asignado</span>
        </div>
        <div class="hud-meta">
          <span>Serie: <span id="hud-unit-sn" class="hud-sn">TR01-SN-2026-0001</span></span> · 
          <span>Control: <strong style="color:#ffffff">ESP8266</strong></span> · 
          <span>Propietario: <strong id="hud-unit-owner" style="color:var(--pink-light)">usuario</strong></span>
        </div>
      </div>
    </div>
    <div class="d-flex align-items-center gap-2">
      <label for="hud-unit-select" class="small text-muted m-0" style="color:#d5cbe0 !important">Cambiar Unidad:</label>
      <select id="hud-unit-select" class="form-select form-select-sm hud-select">
        <option value="1">#1 Terreneitor (Vendido)</option>
        <option value="2">#2 Terreneitor Exhibición (Demo)</option>
      </select>
    </div>
  `;

  // 2. Contenedor de Pestañas
  const navigation = document.createElement("div");
  navigation.id = "user-panel-tabs";
  navigation.className = "user-panel-tabs";
  navigation.setAttribute("role", "tablist");
  navigation.setAttribute("aria-label", "Navegación del sistema");

  // Configuración de pestañas según rol
  let tabConfigs = [];
  if (rol === "administradora" || rol === "administrador") {
    tabConfigs = [
      { id: "admin", label: "ADMINISTRACIÓN", className: "user-admin-panel" },
      { id: "control", label: "CONTROL", className: "user-control-panel" },
      { id: "monitoring", label: "MONITOREO", className: "user-monitoring-panel glass-card" }
    ];
  } else {
    tabConfigs = [
      { id: "control", label: "CONTROL", className: "user-control-panel" },
      { id: "monitoring", label: "MONITOREO", className: "user-monitoring-panel glass-card" },
      { id: "demos", label: "MIS DEMOS", className: "user-demos-panel" }
    ];
  }

  const panels = tabConfigs.map(cfg => {
    const p = document.createElement("section");
    // El panel de monitoreo DEBE llamarse 'user-monitoring-panel' para heredar el layout completo de 4.2
    p.id = cfg.id === "monitoring" ? "user-monitoring-panel" : `panel-${cfg.id}`;
    p.className = cfg.className;
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", `tab-${cfg.id}`);
    p.tabIndex = 0;
    p.hidden = true;
    return p;
  });

  const layout = shell.querySelector(".control-layout");
  const stopBand = shell.querySelector(".stop-band");
  const events = shell.querySelector(".events-disclosure");

  shell.insertBefore(hud, layout);
  shell.insertBefore(navigation, layout);
  panels.forEach(p => shell.insertBefore(p, layout));

  // Control panel alberga el joystick y controles
  const controlPanel = panels.find(p => p.id === "panel-control");
  if (controlPanel && layout) {
    controlPanel.append(layout, stopBand);
    configurarControlesAvanzados(layout, shell);
  }

  // Monitoring panel: ocultar la bandeja de eventos WebSocket repetitiva para dar espacio completo a las 10 filas
  const monitorPanel = panels.find(p => p.id === "user-monitoring-panel");
  if (events) {
    events.hidden = true;
    events.style.display = "none";
  }

  // Selector de HUD
  const hudSelect = hud.querySelector("#hud-unit-select");
  hudSelect?.addEventListener("change", async () => {
    const nuevoId = parseInt(hudSelect.value, 10);
    window.SCARLETTE_CONFIG = Object.assign({}, window.SCARLETTE_CONFIG, { VEHICLE_ID: nuevoId });

    if (nuevoId === 2) {
      hud.querySelector("#hud-unit-name").textContent = "#2 Terreneitor Exhibición";
      hud.querySelector("#hud-unit-sn").textContent = "TR01-EXH-2026-0002";
      hud.querySelector("#hud-unit-badge").className = "badge-scarlette-exhibicion";
      hud.querySelector("#hud-unit-badge").textContent = "Unidad de Exhibición";
      hud.querySelector("#hud-unit-owner").textContent = "Empresa (Demo)";
    } else {
      hud.querySelector("#hud-unit-name").textContent = "#1 Terreneitor TR-01";
      hud.querySelector("#hud-unit-sn").textContent = "TR01-SN-2026-0001";
      hud.querySelector("#hud-unit-badge").className = "badge-scarlette-vendido";
      hud.querySelector("#hud-unit-badge").textContent = "Vendido · Asignado";
      hud.querySelector("#hud-unit-owner").textContent = "usuario";
    }

    // Actualizar telemetría y conexiones
    window.SCARLETTE_CONNECTIONS?.solicitarActualizacion();
    document.dispatchEvent(new CustomEvent("scarlette:panel-cambiado", {
      detail: { panel: tabConfigs[selectedIndex]?.id || "control", vehiculoId: nuevoId }
    }));
  });

  // Manejador de cambio de pestañas
  let selectedIndex = 0;
  let switching = false;

  const buttons = tabConfigs.map((cfg, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = `tab-${cfg.id}`;
    tab.textContent = cfg.label;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    tab.setAttribute("aria-selected", String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    navigation.append(tab);

    tab.addEventListener("click", async () => {
      if (switching || selectedIndex === index) return;
      switching = true;
      try {
        if (cfg.id !== "control" && window.SCARLETTE_CONTROLS?.prepararOcultacion) {
          await window.SCARLETTE_CONTROLS.prepararOcultacion();
        }

        panels[selectedIndex].hidden = true;
        selectedIndex = index;
        panels[selectedIndex].hidden = false;

        buttons.forEach((b, i) => {
          b.setAttribute("aria-selected", String(i === selectedIndex));
          b.tabIndex = i === selectedIndex ? 0 : -1;
        });

        tab.focus();

        if (cfg.id === "admin" && window.SCARLETTE_ADMIN) {
          await window.SCARLETTE_ADMIN.renderizarEn(panels[index]);
        } else if (cfg.id === "demos" && window.SCARLETTE_DEMOS_EDITOR) {
          const vId = window.SCARLETTE_CONFIG?.VEHICLE_ID || 1;
          await window.SCARLETTE_DEMOS_EDITOR.renderizarEn(panels[index], vId);
        }

        document.dispatchEvent(new CustomEvent("scarlette:panel-cambiado", {
          detail: { panel: cfg.id }
        }));
      } finally {
        switching = false;
      }
    });

    return tab;
  });

  // Mostrar el panel inicial
  panels[0].hidden = false;
  if (tabConfigs[0].id === "admin" && window.SCARLETTE_ADMIN) {
    await window.SCARLETTE_ADMIN.renderizarEn(panels[0]);
  }
});

function configurarModoInvitado(shell) {
  window.SCARLETTE_CONFIG = Object.assign({}, window.SCARLETTE_CONFIG, {
    VEHICLE_ID: window.SCARLETTE_CONFIG.EXHIBITION_VEHICLE_ID || 2
  });

  let segundosRestantes = 180;
  const banner = document.createElement("div");
  banner.className = "vehicle-hud glass-card mb-3 d-flex align-items-center justify-content-between";
  banner.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <div class="hud-icon-box">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 13 8 7h8l3 6M3 13h18v5h-2m-14 0H3v-5m5 5h8M9 10h6"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/></svg>
      </div>
      <div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge-scarlette-exhibicion">Demostración Temporal</span>
          <strong class="text-white">Unidad #2 Terreneitor Exhibición</strong>
        </div>
        <div class="hud-meta">
          <span>Tiempo Restante: <strong id="timer-invitado" style="color:#ffc107; font-size:14px">03:00</strong></span> · 
          <span>Comandos habilitados en vivo</span>
        </div>
      </div>
    </div>
    <button id="btn-finalizar-demo-invitado" class="outline-button-sm">Finalizar Demostración</button>
  `;

  shell.insertBefore(banner, shell.firstChild);

  const timerElem = banner.querySelector("#timer-invitado");
  const intervalo = setInterval(() => {
    segundosRestantes--;
    if (segundosRestantes <= 0) {
      clearInterval(intervalo);
      alert("Tu tiempo de demostración ha concluido. El vehículo se detuvo con seguridad.");
      window.SCARLETTE_API.solicitar(`/vehiculos/${window.SCARLETTE_CONFIG.VEHICLE_ID}/detener`, { method: "POST" }).finally(() => {
        window.location.replace("index.html");
      });
      return;
    }
    const mins = String(Math.floor(segundosRestantes / 60)).padStart(2, "0");
    const secs = String(segundosRestantes % 60).padStart(2, "0");
    if (timerElem) timerElem.textContent = `${mins}:${secs}`;
  }, 1000);

  banner.querySelector("#btn-finalizar-demo-invitado")?.addEventListener("click", async () => {
    clearInterval(intervalo);
    await window.SCARLETTE_API.solicitar(`/vehiculos/${window.SCARLETTE_CONFIG.VEHICLE_ID}/detener`, { method: "POST" });
    window.location.replace("index.html");
  });
}

function configurarControlesAvanzados(layout, shell) {
  const demoCard = layout.querySelector(".demo-card");
  const demoColumn = layout.querySelector(".demo-column");
  if (!demoCard || document.getElementById("custom-movement-section")) return;

  // 1. Botón para abrir el diseñador de DEMOs directamente desde CONTROL
  const btnAbrirDemos = document.createElement("button");
  btnAbrirDemos.id = "btn-abrir-editor-demos";
  btnAbrirDemos.type = "button";
  btnAbrirDemos.className = "outline-button-sm w-100 mt-3";
  btnAbrirDemos.innerHTML = `<svg class="icon" style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> ⚙ Diseñar / Personalizar DEMOs`;
  demoCard.appendChild(btnAbrirDemos);

  // 2. Modal Flotante para el Editor de DEMOs
  let modalDemos = document.getElementById("modal-demos-overlay");
  if (!modalDemos) {
    modalDemos = document.createElement("div");
    modalDemos.id = "modal-demos-overlay";
    modalDemos.style.cssText = "display:none; position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); padding:20px; overflow-y:auto;";
    modalDemos.innerHTML = `
      <div class="glass-card" style="max-width:1100px; margin:20px auto; padding:24px; border:2px solid var(--pink); border-radius:24px; background:#120e17; box-shadow:0 0 40px rgba(242,11,131,0.4);">
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style="border-color:#4d3b55 !important">
          <h2 class="card-heading m-0" style="border:none">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m7 3 14 9-14 9Z"/></svg>
            Diseñador Interactivo de Secuencias DEMO
          </h2>
          <button id="btn-cerrar-modal-demos" class="outline-button-sm">✕ Cerrar Editor</button>
        </div>
        <div id="modal-demos-mount-point"></div>
      </div>
    `;
    document.body.appendChild(modalDemos);

    modalDemos.querySelector("#btn-cerrar-modal-demos").addEventListener("click", () => {
      modalDemos.style.display = "none";
      window.SCARLETTE_CONTROLS?.cargarDemos?.();
    });
  }

  btnAbrirDemos.addEventListener("click", async () => {
    modalDemos.style.display = "block";
    const vId = window.SCARLETTE_CONFIG?.VEHICLE_ID || 1;
    const mount = modalDemos.querySelector("#modal-demos-mount-point");
    if (window.SCARLETTE_DEMOS_EDITOR) {
      await window.SCARLETTE_DEMOS_EDITOR.renderizarEn(mount, vId);
    }
  });

  // 3. Tarjeta de Movimiento Personalizado (Ángulo / Duración)
  const customCard = document.createElement("div");
  customCard.id = "custom-movement-section";
  customCard.className = "glass-card custom-movement-card";
  customCard.innerHTML = `
    <h2 class="card-heading" style="font-size:17px; margin-bottom:12px">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><circle cx="12" cy="12" r="7"/></svg>
      Movimiento Personalizado
    </h2>
    
    <div class="mb-2">
      <label class="small text-muted mb-1 d-block">Movimiento:</label>
      <select id="custom-mov-comando" class="form-select form-select-sm">
        <option value="1">Avanzar (Recto)</option>
        <option value="2">Retroceder (Recto)</option>
        <option value="12">Girar a la Izquierda</option>
        <option value="13">Girar a la Derecha</option>
        <option value="6">Desplazar a la Izquierda</option>
        <option value="8">Desplazar a la Derecha</option>
        <option value="3">Avanzar Diag. Izquierda</option>
        <option value="5">Avanzar Diag. Derecha</option>
        <option value="11">Giro 360° Continuo</option>
        <option value="7">Enderezar / Jorobar Postura</option>
      </select>
    </div>

    <div class="mb-2">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <label class="small text-muted m-0">Modo:</label>
        <div class="d-flex gap-1">
          <button type="button" id="btn-modo-tiempo" class="chip-btn active">Por Segundos</button>
          <button type="button" id="btn-modo-grados" class="chip-btn">Por Grados</button>
        </div>
      </div>

      <!-- Ajuste por Segundos -->
      <div id="seccion-tiempo">
        <div class="chip-grid">
          <button type="button" class="chip-btn chip-tiempo" data-segundos="0.5">0.5s</button>
          <button type="button" class="chip-btn chip-tiempo" data-segundos="1.0">1.0s</button>
          <button type="button" class="chip-btn chip-tiempo active" data-segundos="2.0">2.0s</button>
          <button type="button" class="chip-btn chip-tiempo" data-segundos="3.0">3.0s</button>
          <button type="button" class="chip-btn chip-tiempo" data-segundos="5.0">5.0s</button>
        </div>
        <div class="d-flex align-items-center gap-2 mt-2">
          <input type="number" id="input-tiempo-seg" class="form-control form-control-sm text-center" min="0.2" max="10.0" step="0.1" value="2.0" style="width:90px">
          <span class="small text-muted">segundos de duración</span>
        </div>
      </div>

      <!-- Ajuste por Grados -->
      <div id="seccion-grados" style="display:none">
        <div class="chip-grid">
          <button type="button" class="chip-btn chip-grados" data-grados="45">45°</button>
          <button type="button" class="chip-btn chip-grados active" data-grados="90">90°</button>
          <button type="button" class="chip-btn chip-grados" data-grados="180">180°</button>
          <button type="button" class="chip-btn chip-grados" data-grados="360">360°</button>
        </div>
        <div class="d-flex align-items-center gap-2 mt-2">
          <input type="number" id="input-grados" class="form-control form-control-sm text-center" min="15" max="720" step="15" value="90" style="width:90px">
          <span class="small text-muted">grados (≈ <span id="lbl-ms-estimado" style="color:var(--pink-light)">800</span> ms)</span>
        </div>
      </div>
    </div>

    <div class="execution-progress mb-2" id="progreso-ejecucion" style="display:none">
      <div class="execution-progress-bar" id="barra-progreso"></div>
    </div>

    <button id="btn-ejecutar-custom" class="neon-button py-2 w-100 mt-2" style="font-size:15px">
      ▶ Ejecutar Movimiento
    </button>
    <div id="status-custom-mov" class="small text-center mt-2" style="color:var(--muted); min-height:18px"></div>
  `;

  if (demoColumn) {
    demoColumn.appendChild(customCard);
  } else {
    demoCard.after(customCard);
  }

  // Lógica interactiva de Movimiento Personalizado
  let modoActual = "tiempo";
  const btnTiempo = customCard.querySelector("#btn-modo-tiempo");
  const btnGrados = customCard.querySelector("#btn-modo-grados");
  const secTiempo = customCard.querySelector("#seccion-tiempo");
  const secGrados = customCard.querySelector("#seccion-grados");
  const inputTiempo = customCard.querySelector("#input-tiempo-seg");
  const inputGrados = customCard.querySelector("#input-grados");
  const lblMs = customCard.querySelector("#lbl-ms-estimado");

  btnTiempo.addEventListener("click", () => {
    modoActual = "tiempo";
    btnTiempo.classList.add("active");
    btnGrados.classList.remove("active");
    secTiempo.style.display = "block";
    secGrados.style.display = "none";
  });

  btnGrados.addEventListener("click", () => {
    modoActual = "grados";
    btnGrados.classList.add("active");
    btnTiempo.classList.remove("active");
    secGrados.style.display = "block";
    secTiempo.style.display = "none";
  });

  customCard.querySelectorAll(".chip-tiempo").forEach(chip => {
    chip.addEventListener("click", () => {
      customCard.querySelectorAll(".chip-tiempo").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      inputTiempo.value = chip.getAttribute("data-segundos");
    });
  });

  customCard.querySelectorAll(".chip-grados").forEach(chip => {
    chip.addEventListener("click", () => {
      customCard.querySelectorAll(".chip-grados").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const g = parseInt(chip.getAttribute("data-grados"), 10);
      inputGrados.value = g;
      lblMs.textContent = Math.round((g / 360) * 3200);
    });
  });

  inputGrados.addEventListener("input", () => {
    const g = parseInt(inputGrados.value, 10) || 0;
    lblMs.textContent = Math.round((g / 360) * 3200);
  });

  let ejecutandoCustom = false;
  const btnEjecutar = customCard.querySelector("#btn-ejecutar-custom");
  const statusLbl = customCard.querySelector("#status-custom-mov");
  const progBox = customCard.querySelector("#progreso-ejecucion");
  const progBar = customCard.querySelector("#barra-progreso");

  btnEjecutar.addEventListener("click", async () => {
    if (ejecutandoCustom) return;
    const vId = window.SCARLETTE_CONFIG?.VEHICLE_ID || 1;
    const idComando = parseInt(customCard.querySelector("#custom-mov-comando").value, 10);

    let duracionMs = 2000;
    if (modoActual === "tiempo") {
      duracionMs = Math.round(parseFloat(inputTiempo.value || 2.0) * 1000);
    } else {
      const g = parseInt(inputGrados.value || 90, 10);
      duracionMs = Math.round((g / 360) * 3200);
    }

    if (duracionMs < 200) duracionMs = 200;
    if (duracionMs > 12000) duracionMs = 12000;

    ejecutandoCustom = true;
    btnEjecutar.disabled = true;
    btnEjecutar.textContent = `⏳ Ejecutando (${(duracionMs / 1000).toFixed(1)}s)...`;
    statusLbl.style.color = "var(--pink-light)";
    statusLbl.textContent = `Enviando comando #${idComando} a unidad #${vId}...`;
    progBox.style.display = "block";
    progBar.style.width = "0%";

    try {
      await window.SCARLETTE_API.solicitar(`/vehiculos/${vId}/movimientos`, {
        method: "POST",
        body: JSON.stringify({ id_comando: idComando, origen: "scarlette_personalizado" })
      });

      statusLbl.textContent = `Movimiento activo. Parada automática en ${(duracionMs / 1000).toFixed(1)}s.`;

      const inicio = Date.now();
      const animInterval = setInterval(() => {
        const transcurrido = Date.now() - inicio;
        const pct = Math.min(100, (transcurrido / duracionMs) * 100);
        progBar.style.width = `${pct}%`;
        if (transcurrido >= duracionMs) clearInterval(animInterval);
      }, 50);

      await new Promise(res => setTimeout(res, duracionMs));

      // Enviar STOP automático
      await window.SCARLETTE_API.solicitar(`/vehiculos/${vId}/detener`, { method: "POST" });
      statusLbl.style.color = "#39e6a3";
      statusLbl.textContent = `✓ Movimiento completado y detenido con seguridad.`;
    } catch (err) {
      statusLbl.style.color = "#ff6b6b";
      statusLbl.textContent = `Error: ${err.message || "desconocido"}`;
      await window.SCARLETTE_API.solicitar(`/vehiculos/${vId}/detener`, { method: "POST" }).catch(() => {});
    } finally {
      ejecutandoCustom = false;
      btnEjecutar.disabled = false;
      btnEjecutar.textContent = "▶ Ejecutar Movimiento";
      setTimeout(() => {
        progBox.style.display = "none";
        progBar.style.width = "0%";
      }, 3000);
    }
  });
}
