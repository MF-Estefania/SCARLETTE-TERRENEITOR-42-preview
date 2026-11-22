"use strict";

window.SCARLETTE_ADMIN = (() => {
  const api = window.SCARLETTE_API;

  async function cargarDashboard() {
    try {
      return await api.solicitar("/admin/dashboard", { method: "GET" });
    } catch (e) {
      console.error("Error al cargar dashboard admin:", e);
      return null;
    }
  }

  async function cargarUnidades() {
    try {
      return await api.solicitar("/admin/unidades", { method: "GET" });
    } catch (e) {
      console.error("Error al cargar unidades:", e);
      return [];
    }
  }

  async function cargarModelos() {
    try {
      return await api.solicitar("/admin/modelos", { method: "GET" });
    } catch (e) {
      console.error("Error al cargar modelos:", e);
      return [];
    }
  }

  async function cargarClientes() {
    try {
      return await api.solicitar("/admin/clientes", { method: "GET" });
    } catch (e) {
      console.error("Error al cargar clientes:", e);
      return [];
    }
  }

  async function cargarAuditoria() {
    try {
      return await api.solicitar("/admin/auditoria?limite=30", { method: "GET" });
    } catch (e) {
      console.error("Error al cargar auditoria:", e);
      return [];
    }
  }

  async function renderizarEn(contenedor) {
    contenedor.innerHTML = `
      <div class="admin-panel-content">
        <!-- 1. Encabezado de métricas -->
        <div class="glass-card mb-4 p-4">
          <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2" style="border-color:#60405b !important">
            <h2 class="card-heading m-0" style="border:none">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Dashboard Comercial & Métricas Reales
            </h2>
            <button id="btn-refrescar-admin" class="neon-button py-2 px-3" style="width:auto; font-size:14px">Actualizar</button>
          </div>
          <div id="admin-metrics-row" class="row g-3">
            <div class="col-6 col-md-3">
              <div class="metric-card">
                <span class="metric-label">Modelos Registrados</span>
                <h3 id="metric-modelos" class="metric-value">-</h3>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="metric-card">
                <span class="metric-label">Unidades Físicas</span>
                <h3 id="metric-unidades" class="metric-value">-</h3>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="metric-card">
                <span class="metric-label">En Exhibición</span>
                <h3 id="metric-exhibicion" class="metric-value">-</h3>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="metric-card">
                <span class="metric-label">Clientes Compradores</span>
                <h3 id="metric-clientes" class="metric-value">-</h3>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Secciones con sub-pestañas estilizadas SCARLETTE -->
        <div class="glass-card p-4">
          <div class="scarlette-pills" id="admin-subtabs" role="tablist">
            <button class="scarlette-pill active" data-target="tab-unidades" type="button">Inventario de Unidades</button>
            <button class="scarlette-pill" data-target="tab-modelos" type="button">Modelos Comerciales</button>
            <button class="scarlette-pill" data-target="tab-clientes" type="button">Clientes y Asignaciones</button>
            <button class="scarlette-pill" data-target="tab-auditoria" type="button">Bitácora de Auditoría</button>
          </div>

          <div class="admin-tab-panels">
            <!-- Pestaña 1: Inventario -->
            <div class="admin-subtab-pane" id="tab-unidades">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="m-0 fs-5 text-white">Unidades Físicas Registradas</h3>
                <button id="btn-nueva-unidad" class="neon-button py-2 px-3" style="width:auto; font-size:14px">+ Nueva Unidad</button>
              </div>

              <!-- Formulario de alta rápida -->
              <div id="form-nueva-unidad" class="glass-card p-3 mb-3" style="display:none; background:#1b1522">
                <h4 class="fs-6 mb-2" style="color:var(--pink-light)">Registrar Nueva Unidad Física</h4>
                <div class="row g-2">
                  <div class="col-md-3"><input id="new-u-nombre" class="form-control form-control-sm" placeholder="Nombre (ej. Terreneitor 3)"></div>
                  <div class="col-md-3"><input id="new-u-serie" class="form-control form-control-sm" placeholder="Número de Serie (ej. TR01-SN-003)"></div>
                  <div class="col-md-3">
                    <select id="new-u-estado" class="form-select form-select-sm">
                      <option value="disponible">Disponible (Stock)</option>
                      <option value="exhibicion">Exhibición (Demo)</option>
                      <option value="mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
                  <div class="col-md-3 d-flex gap-2">
                    <button id="btn-guardar-unidad" class="neon-button py-1 px-3" style="font-size:13px">Guardar</button>
                    <button id="btn-cancelar-unidad" class="outline-button m-0 py-1 px-3" style="font-size:13px">Cancelar</button>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-dark table-hover align-middle m-0" style="background:transparent">
                  <thead>
                    <tr style="border-bottom: 2px solid #8a3463">
                      <th style="background:#ff349f18; color:var(--pink-light)">ID</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Nombre</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Modelo</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Número de Serie</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Estado Comercial</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Propietario</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Acción</th>
                    </tr>
                  </thead>
                  <tbody id="tbody-unidades"><tr><td colspan="7" class="text-center p-3 text-muted">Cargando inventario...</td></tr></tbody>
                </table>
              </div>
            </div>

            <!-- Pestaña 2: Modelos -->
            <div class="admin-subtab-pane" id="tab-modelos" style="display:none">
              <h3 class="fs-5 mb-3 text-white">Catálogo de Modelos Comerciales</h3>
              <div class="table-responsive">
                <table class="table table-dark table-hover align-middle m-0" style="background:transparent">
                  <thead>
                    <tr style="border-bottom: 2px solid #8a3463">
                      <th style="background:#ff349f18; color:var(--pink-light)">ID</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Nombre Modelo</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Microcontrolador</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Descripción</th>
                    </tr>
                  </thead>
                  <tbody id="tbody-modelos"><tr><td colspan="4" class="text-center p-3 text-muted">Cargando modelos...</td></tr></tbody>
                </table>
              </div>
            </div>

            <!-- Pestaña 3: Clientes -->
            <div class="admin-subtab-pane" id="tab-clientes" style="display:none">
              <h3 class="fs-5 mb-3 text-white">Clientes y Unidades Asignadas</h3>
              <div class="table-responsive">
                <table class="table table-dark table-hover align-middle m-0" style="background:transparent">
                  <thead>
                    <tr style="border-bottom: 2px solid #8a3463">
                      <th style="background:#ff349f18; color:var(--pink-light)">ID</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Nombre Usuario</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Rol</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Unidades Asignadas</th>
                    </tr>
                  </thead>
                  <tbody id="tbody-clientes"><tr><td colspan="4" class="text-center p-3 text-muted">Cargando clientes...</td></tr></tbody>
                </table>
              </div>
            </div>

            <!-- Pestaña 4: Auditoría -->
            <div class="admin-subtab-pane" id="tab-auditoria" style="display:none">
              <h3 class="fs-5 mb-3 text-white">Bitácora de Auditoría en Tiempo Real</h3>
              <div class="table-responsive">
                <table class="table table-dark table-sm table-hover align-middle m-0" style="background:transparent">
                  <thead>
                    <tr style="border-bottom: 2px solid #8a3463">
                      <th style="background:#ff349f18; color:var(--pink-light)">Fecha / Hora</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Usuario</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Acción</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Recurso</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Detalle</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Resultado</th>
                    </tr>
                  </thead>
                  <tbody id="tbody-auditoria"><tr><td colspan="6" class="text-center p-3 text-muted">Cargando auditoría...</td></tr></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Manejo de sub-pestañas
    const pills = contenedor.querySelectorAll(".scarlette-pill");
    const panes = contenedor.querySelectorAll(".admin-subtab-pane");
    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        panes.forEach(pane => (pane.style.display = "none"));
        pill.classList.add("active");
        const target = contenedor.querySelector(`#${pill.getAttribute("data-target")}`);
        if (target) target.style.display = "block";
      });
    });

    // Eventos
    contenedor.querySelector("#btn-refrescar-admin")?.addEventListener("click", () => recargarDatos(contenedor));
    const formNueva = contenedor.querySelector("#form-nueva-unidad");
    contenedor.querySelector("#btn-nueva-unidad")?.addEventListener("click", () => {
      formNueva.style.display = formNueva.style.display === "none" ? "block" : "none";
    });
    contenedor.querySelector("#btn-cancelar-unidad")?.addEventListener("click", () => {
      formNueva.style.display = "none";
    });
    contenedor.querySelector("#btn-guardar-unidad")?.addEventListener("click", async () => {
      const nombre = contenedor.querySelector("#new-u-nombre").value.trim();
      const serie = contenedor.querySelector("#new-u-serie").value.trim();
      const estado = contenedor.querySelector("#new-u-estado").value;
      if (!nombre || !serie) {
        alert("Completa el nombre y número de serie");
        return;
      }
      try {
        await api.solicitar("/admin/unidades", {
          method: "POST",
          body: JSON.stringify({
            id_modelo: 1,
            nombre: nombre,
            modelo: "TR-01",
            numero_serie: serie,
            descripcion: "Unidad registrada desde panel de administración",
            microcontrolador: "ESP8266",
            estado_comercial: estado,
            activo: true
          })
        });
        formNueva.style.display = "none";
        await recargarDatos(contenedor);
      } catch (e) {
        alert("Error al registrar unidad: " + (e.message || "desconocido"));
      }
    });

    await recargarDatos(contenedor);
  }

  async function recargarDatos(contenedor) {
    const metricas = await cargarDashboard();
    if (metricas) {
      contenedor.querySelector("#metric-modelos").textContent = metricas.modelos;
      contenedor.querySelector("#metric-unidades").textContent = metricas.unidades_totales;
      contenedor.querySelector("#metric-exhibicion").textContent = metricas.exhibicion;
      contenedor.querySelector("#metric-clientes").textContent = metricas.clientes;
    }

    // Unidades
    const unidades = await cargarUnidades();
    const tbodyU = contenedor.querySelector("#tbody-unidades");
    if (tbodyU) {
      tbodyU.innerHTML = unidades.map(u => {
        let badgeClass = "badge-scarlette-disponible";
        if (u.estado_comercial === "vendido") badgeClass = "badge-scarlette-vendido";
        if (u.estado_comercial === "exhibicion") badgeClass = "badge-scarlette-exhibicion";

        return `
          <tr>
            <td><strong style="color:var(--pink-light)">#${u.id_vehiculo}</strong></td>
            <td style="color:#ffffff; font-weight:700">${u.nombre}</td>
            <td><span class="badge" style="background:#2a1a2b; border:1px solid #614765; color:#f6b5d8">${u.modelo || 'TR-01'}</span></td>
            <td><span class="hud-sn">${u.numero_serie || 'S/N'}</span></td>
            <td><span class="${badgeClass}">${u.estado_comercial.toUpperCase()}</span></td>
            <td>${u.propietario ? `<span class="badge-scarlette-usuario">${u.propietario}</span>` : '<em style="color:#a899b5">Stock Empresa</em>'}</td>
            <td>
              <button class="outline-button-sm btn-asignar" data-id="${u.id_vehiculo}">
                ${u.id_propietario ? 'Reasignar' : 'Asignar'}
              </button>
            </td>
          </tr>
        `;
      }).join("");

      tbodyU.querySelectorAll(".btn-asignar").forEach(btn => {
        btn.addEventListener("click", async () => {
          const idV = btn.getAttribute("data-id");
          const usuarioId = prompt("Ingresa el ID del cliente al que deseas asignar esta unidad (o déjalo vacío para devolver a stock):", "2");
          if (usuarioId === null) return;
          try {
            await api.solicitar("/admin/asignaciones", {
              method: "POST",
              body: JSON.stringify({
                id_vehiculo: parseInt(idV, 10),
                id_usuario: usuarioId.trim() ? parseInt(usuarioId.trim(), 10) : null,
                estado_comercial: usuarioId.trim() ? "vendido" : "disponible"
              })
            });
            await recargarDatos(contenedor);
          } catch (e) {
            alert("Error al asignar unidad: " + (e.message || "desconocido"));
          }
        });
      });
    }

    // Modelos
    const modelos = await cargarModelos();
    const tbodyM = contenedor.querySelector("#tbody-modelos");
    if (tbodyM) {
      tbodyM.innerHTML = modelos.map(m => `
        <tr>
          <td><strong style="color:var(--pink-light)">#${m.id_modelo}</strong></td>
          <td style="color:#ffffff; font-weight:700">${m.nombre_modelo}</td>
          <td><span class="badge" style="background:#2a1a2b; border:1px solid #614765; color:#f6b5d8">${m.microcontrolador}</span></td>
          <td style="color:#d5cbe0; font-size:13px">${m.descripcion || '-'}</td>
        </tr>
      `).join("");
    }

    // Clientes
    const clientes = await cargarClientes();
    const tbodyC = contenedor.querySelector("#tbody-clientes");
    if (tbodyC) {
      tbodyC.innerHTML = clientes.map(c => `
        <tr>
          <td><strong style="color:var(--pink-light)">#${c.id_usuario}</strong></td>
          <td style="color:#ffffff; font-weight:700">${c.nombre_usuario}</td>
          <td><span class="badge" style="background:#2a1a2b; border:1px solid #614765; color:var(--pink-light)">${c.rol}</span></td>
          <td><span class="badge-scarlette-vendido">${c.unidades_asignadas} unidad(es)</span></td>
        </tr>
      `).join("");
    }

    // Auditoría
    const auditoria = await cargarAuditoria();
    const tbodyA = contenedor.querySelector("#tbody-auditoria");
    if (tbodyA) {
      tbodyA.innerHTML = auditoria.map(a => `
        <tr>
          <td style="color:#d5cbe0; font-size:12px">${a.fecha_hora ? a.fecha_hora.replace('T', ' ').substring(0, 19) : '-'}</td>
          <td style="color:#ffffff; font-weight:700">${a.nombre_usuario || 'sistema'}</td>
          <td><span class="badge" style="background:#3a1532; border:1px solid #8a3463; color:var(--pink-light)">${a.accion}</span></td>
          <td style="font-family:monospace; color:#f6b5d8; font-size:12px">${a.recurso}</td>
          <td style="color:#ded0e5; font-size:12px">${a.detalle || ''}</td>
          <td><span class="${a.resultado === 'EXITO' ? 'badge-scarlette-vendido' : 'badge-scarlette-exhibicion'}">${a.resultado}</span></td>
        </tr>
      `).join("");
    }
  }

  return Object.freeze({
    renderizarEn,
    recargarDatos
  });
})();
