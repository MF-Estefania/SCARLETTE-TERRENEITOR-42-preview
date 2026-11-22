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
  }

  // Monitoring panel
  const monitorPanel = panels.find(p => p.id === "user-monitoring-panel");
  if (monitorPanel && events) {
    const heading = document.createElement("h2");
    heading.className = "card-heading";
    heading.textContent = "Actividad en tiempo real (WebSocket)";
    events.querySelector(".events-toggle")?.replaceChildren(heading);
    monitorPanel.append(events);
    events.open = true; // Abierto para no dejar espacio vacío
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
