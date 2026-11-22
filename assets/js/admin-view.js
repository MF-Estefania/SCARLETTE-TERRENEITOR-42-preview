"use strict";

window.SCARLETTE_ADMIN = (() => {
  const api = window.SCARLETTE_API;
  let clientesCache = [];
  let unidadAsignandoId = null;

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
        <!-- 1. Encabezado de métricas compacto -->
        <div class="glass-card mb-3 p-3">
          <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2" style="border-color:#60405b !important">
            <h2 class="card-heading m-0" style="border:none; font-size:17px">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Dashboard Comercial & Métricas Reales
            </h2>
            <button id="btn-refrescar-admin" class="neon-button py-1 px-3" style="width:auto; font-size:13px">↻ Actualizar</button>
          </div>
          <div id="admin-metrics-row" class="row g-2">
            <div class="col-6 col-md-3">
              <div class="metric-card" style="padding:10px 14px">
                <span class="metric-label" style="font-size:10px; margin-bottom:4px">Modelos Registrados</span>
                <h3 id="metric-modelos" class="metric-value" style="font-size:26px">-</h3>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="metric-card" style="padding:10px 14px">
                <span class="metric-label" style="font-size:10px; margin-bottom:4px">Unidades Físicas</span>
                <h3 id="metric-unidades" class="metric-value" style="font-size:26px">-</h3>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="metric-card" style="padding:10px 14px">
                <span class="metric-label" style="font-size:10px; margin-bottom:4px">En Exhibición</span>
                <h3 id="metric-exhibicion" class="metric-value" style="font-size:26px">-</h3>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="metric-card" style="padding:10px 14px">
                <span class="metric-label" style="font-size:10px; margin-bottom:4px">Clientes Compradores</span>
                <h3 id="metric-clientes" class="metric-value" style="font-size:26px">-</h3>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Secciones con sub-pestañas estilizadas SCARLETTE -->
        <div class="glass-card p-3">
          <div class="scarlette-pills mb-3 pb-2" id="admin-subtabs" role="tablist">
            <button class="scarlette-pill active" data-target="tab-unidades" type="button">Inventario de Unidades</button>
            <button class="scarlette-pill" data-target="tab-modelos" type="button">Modelos Comerciales</button>
            <button class="scarlette-pill" data-target="tab-clientes" type="button">Clientes y Asignaciones</button>
            <button class="scarlette-pill" data-target="tab-auditoria" type="button">Bitácora de Auditoría</button>
          </div>

          <div class="admin-tab-panels">
            <!-- Pestaña 1: Inventario -->
            <div class="admin-subtab-pane" id="tab-unidades">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h3 class="m-0 fs-6 text-white">Unidades Físicas</h3>
                <button id="btn-nueva-unidad" class="neon-button py-1 px-3" style="width:auto; font-size:13px">+ Nueva Unidad</button>
              </div>

              <!-- Formulario de alta rápida -->
              <div id="form-nueva-unidad" class="glass-card p-3 mb-2" style="display:none; background:#1b1522">
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

              <!-- Selector visual de asignación de cliente -->
              <div id="form-asignar-unidad" class="glass-card p-2 mb-2" style="display:none; background:#1b1522">
                <h4 id="titulo-asignar-unidad" class="mb-1" style="color:var(--pink-light); font-size:13px">Asignar Unidad a Cliente</h4>
                <div class="row g-2">
                  <div class="col-md-5">
                    <select id="asignar-cliente-select" class="form-select form-select-sm"></select>
                  </div>
                  <div class="col-md-4">
                    <select id="asignar-estado-select" class="form-select form-select-sm">
                      <option value="vendido">Vendido (Asignado)</option>
                      <option value="disponible">Disponible (Stock)</option>
                      <option value="exhibicion">Exhibición (Demo)</option>
                      <option value="mantenimiento">Mantenimiento</option>
                    </select>
                  </div>
                  <div class="col-md-3 d-flex gap-2">
                    <button id="btn-confirmar-asignacion" class="neon-button py-1 px-3" style="font-size:13px">Confirmar</button>
                    <button id="btn-cancelar-asignacion" class="outline-button m-0 py-1 px-3" style="font-size:13px">Cancelar</button>
                  </div>
                </div>
              </div>

              <div class="table-responsive" style="max-height: 48vh; overflow-y: auto;">
                <table class="table table-dark table-hover table-sm align-middle m-0" style="background:transparent; font-size:13px">
                  <thead>
                    <tr style="border-bottom: 2px solid #8a3463; position:sticky; top:0; background:#1f1522; z-index:2">
                      <th style="color:var(--pink-light)">ID</th>
                      <th style="color:var(--pink-light)">Unidad</th>
                      <th class="d-none d-md-table-cell" style="color:var(--pink-light)">Modelo</th>
                      <th style="color:var(--pink-light)">Serie</th>
                      <th class="d-none d-md-table-cell" style="color:var(--pink-light)">Micro</th>
                      <th style="color:var(--pink-light)">Estado</th>
                      <th style="color:var(--pink-light)">Propietario</th>
                      <th style="color:var(--pink-light)">Acción</th>
                    </tr>
                  </thead>
                  <tbody id="tbody-unidades"><tr><td colspan="8" class="text-center p-3 text-muted">Cargando inventario...</td></tr></tbody>
                </table>
              </div>
            </div>

            <!-- Pestaña 2: Modelos -->
            <div class="admin-subtab-pane" id="tab-modelos" style="display:none">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h3 class="fs-6 m-0 text-white">Modelos Comerciales</h3>
                <button id="btn-nuevo-modelo" class="neon-button py-1 px-3" style="width:auto; font-size:13px">+ Nuevo Modelo</button>
              </div>

              <!-- Formulario de nuevo modelo -->
              <div id="form-nuevo-modelo" class="glass-card p-3 mb-2" style="display:none; background:#1b1522">
                <h4 class="fs-6 mb-2" style="color:var(--pink-light)">Registrar Nuevo Modelo Comercial</h4>
                <div class="row g-2">
                  <div class="col-md-4"><input id="new-m-nombre" class="form-control form-control-sm" placeholder="Nombre (ej. TR-02 Monster Edition)"></div>
                  <div class="col-md-3">
                    <select id="new-m-micro" class="form-select form-select-sm">
                      <option value="ESP8266">ESP8266 NodeMCU</option>
                      <option value="ESP32">ESP32 Dual-Core</option>
                      <option value="Raspberry Pi Pico W">Raspberry Pi Pico W</option>
                    </select>
                  </div>
                  <div class="col-md-3"><input id="new-m-desc" class="form-control form-control-sm" placeholder="Descripción de ingeniería"></div>
                  <div class="col-md-2 d-flex gap-2">
                    <button id="btn-guardar-modelo" class="neon-button py-1 px-3" style="font-size:13px">Guardar</button>
                    <button id="btn-cancelar-modelo" class="outline-button m-0 py-1 px-3" style="font-size:13px">Cancelar</button>
                  </div>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-dark table-hover align-middle m-0" style="background:transparent">
                  <thead>
                    <tr style="border-bottom: 2px solid #8a3463">
                      <th style="background:#ff349f18; color:var(--pink-light)">ID</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Nombre Modelo</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Microcontrolador</th>
                      <th class="d-none d-md-table-cell" style="background:#ff349f18; color:var(--pink-light)">Descripción</th>
                    </tr>
                  </thead>
                  <tbody id="tbody-modelos"><tr><td colspan="4" class="text-center p-3 text-muted">Cargando modelos...</td></tr></tbody>
                </table>
              </div>
            </div>

            <!-- Pestaña 3: Clientes -->
            <div class="admin-subtab-pane" id="tab-clientes" style="display:none">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h3 class="fs-6 m-0 text-white">Clientes y Asignaciones</h3>
                <button id="btn-nuevo-cliente" class="neon-button py-1 px-3" style="width:auto; font-size:13px">+ Nuevo Cliente</button>
              </div>

              <!-- Formulario de nuevo cliente -->
              <div id="form-nuevo-cliente" class="glass-card p-2 mb-2" style="display:none; background:#1b1522">
                <h4 class="mb-1" style="color:var(--pink-light); font-size:13px">Registrar Nuevo Cliente (Cuenta Usuario)</h4>
                <div class="row g-2">
                  <div class="col-md-4"><input id="new-c-usuario" class="form-control form-control-sm" placeholder="Usuario (ej. carlos)" autocomplete="off"></div>
                  <div class="col-md-5"><input id="new-c-password" type="password" class="form-control form-control-sm" placeholder="Contraseña (mín. 6 caracteres)" autocomplete="new-password"></div>
                  <div class="col-md-3 d-flex gap-2">
                    <button id="btn-guardar-cliente" class="neon-button py-1 px-3" style="font-size:13px">Guardar</button>
                    <button id="btn-cancelar-cliente" class="outline-button m-0 py-1 px-3" style="font-size:13px">Cancelar</button>
                  </div>
                </div>
              </div>

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
              <h3 class="fs-6 mb-2 text-white">Bitácora de Auditoría</h3>
              <div class="table-responsive">
                <table class="table table-dark table-sm table-hover align-middle m-0" style="background:transparent">
                  <thead>
                    <tr style="border-bottom: 2px solid #8a3463">
                      <th style="background:#ff349f18; color:var(--pink-light)">Fecha / Hora</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Usuario</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Acción</th>
                      <th style="background:#ff349f18; color:var(--pink-light)">Recurso</th>
                      <th class="d-none d-md-table-cell" style="background:#ff349f18; color:var(--pink-light)">Detalle</th>
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
    const formAsignar = contenedor.querySelector("#form-asignar-unidad");
    const selClienteAsignar = contenedor.querySelector("#asignar-cliente-select");
    const selEstadoAsignar = contenedor.querySelector("#asignar-estado-select");

    contenedor.querySelector("#btn-nueva-unidad")?.addEventListener("click", () => {
      if (formAsignar) formAsignar.style.display = "none";
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
        contenedor.querySelector("#new-u-nombre").value = "";
        contenedor.querySelector("#new-u-serie").value = "";
        await recargarDatos(contenedor);
        document.dispatchEvent(new CustomEvent("scarlette:unidades-actualizadas"));
      } catch (e) {
        alert("Error al registrar unidad: " + (e.message || "desconocido"));
      }
    });

    // Asignar / Reasignar Cliente con selector visual
    selClienteAsignar?.addEventListener("change", () => {
      if (!selEstadoAsignar) return;
      if (selClienteAsignar.value) {
        selEstadoAsignar.value = "vendido";
      } else if (selEstadoAsignar.value === "vendido") {
        selEstadoAsignar.value = "disponible";
      }
    });
    contenedor.querySelector("#btn-cancelar-asignacion")?.addEventListener("click", () => {
      unidadAsignandoId = null;
      if (formAsignar) formAsignar.style.display = "none";
    });
    contenedor.querySelector("#btn-confirmar-asignacion")?.addEventListener("click", async () => {
      if (!unidadAsignandoId) return;
      const clienteVal = selClienteAsignar?.value || "";
      const estadoVal = selEstadoAsignar?.value || (clienteVal ? "vendido" : "disponible");
      try {
        await api.solicitar("/admin/asignaciones", {
          method: "POST",
          body: JSON.stringify({
            id_vehiculo: parseInt(unidadAsignandoId, 10),
            id_usuario: clienteVal ? parseInt(clienteVal, 10) : null,
            estado_comercial: estadoVal
          })
        });
        unidadAsignandoId = null;
        if (formAsignar) formAsignar.style.display = "none";
        await recargarDatos(contenedor);
        document.dispatchEvent(new CustomEvent("scarlette:unidades-actualizadas"));
      } catch (e) {
        alert("Error al asignar unidad: " + (e.message || "desconocido"));
      }
    });

    // Nuevo Modelo
    const formModelo = contenedor.querySelector("#form-nuevo-modelo");
    contenedor.querySelector("#btn-nuevo-modelo")?.addEventListener("click", () => {
      formModelo.style.display = formModelo.style.display === "none" ? "block" : "none";
    });
    contenedor.querySelector("#btn-cancelar-modelo")?.addEventListener("click", () => {
      formModelo.style.display = "none";
    });
    contenedor.querySelector("#btn-guardar-modelo")?.addEventListener("click", async () => {
      const nombre = contenedor.querySelector("#new-m-nombre").value.trim();
      const micro = contenedor.querySelector("#new-m-micro").value;
      const desc = contenedor.querySelector("#new-m-desc").value.trim();
      if (!nombre) {
        alert("Ingresa el nombre del modelo");
        return;
      }
      try {
        await api.solicitar("/admin/modelos", {
          method: "POST",
          body: JSON.stringify({
            nombre_modelo: nombre,
            microcontrolador: micro,
            descripcion: desc || "Modelo comercial IoT",
            activo: true
          })
        });
        formModelo.style.display = "none";
        contenedor.querySelector("#new-m-nombre").value = "";
        contenedor.querySelector("#new-m-desc").value = "";
        await recargarDatos(contenedor);
      } catch (e) {
        alert("Error al registrar modelo: " + (e.message || "desconocido"));
      }
    });

    // Nuevo Cliente (rol usuario)
    const formCliente = contenedor.querySelector("#form-nuevo-cliente");
    contenedor.querySelector("#btn-nuevo-cliente")?.addEventListener("click", () => {
      formCliente.style.display = formCliente.style.display === "none" ? "block" : "none";
    });
    contenedor.querySelector("#btn-cancelar-cliente")?.addEventListener("click", () => {
      formCliente.style.display = "none";
    });
    contenedor.querySelector("#btn-guardar-cliente")?.addEventListener("click", async () => {
      const nombreUsuario = contenedor.querySelector("#new-c-usuario").value.trim();
      const password = contenedor.querySelector("#new-c-password").value;
      if (!nombreUsuario || nombreUsuario.length < 3 || /\s/.test(nombreUsuario)) {
        alert("Ingresa un nombre de usuario válido (mínimo 3 caracteres y sin espacios)");
        return;
      }
      if (!password || password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      try {
        await api.solicitar("/admin/clientes", {
          method: "POST",
          body: JSON.stringify({
            nombre_usuario: nombreUsuario,
            password: password
          })
        });
        formCliente.style.display = "none";
        contenedor.querySelector("#new-c-usuario").value = "";
        contenedor.querySelector("#new-c-password").value = "";
        await recargarDatos(contenedor);
      } catch (e) {
        alert("Error al registrar cliente: " + (e.message || "desconocido"));
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

    // Clientes (cargar primero para alimentar también el selector de asignación)
    const clientes = await cargarClientes();
    clientesCache = Array.isArray(clientes) ? clientes : [];
    const tbodyC = contenedor.querySelector("#tbody-clientes");
    if (tbodyC) {
      tbodyC.innerHTML = clientesCache.map(c => `
        <tr>
          <td><strong style="color:var(--pink-light)">#${c.id_usuario}</strong></td>
          <td style="color:#ffffff; font-weight:700">${c.nombre_usuario}</td>
          <td><span class="badge" style="background:#2a1a2b; border:1px solid #614765; color:var(--pink-light)">${c.rol}</span></td>
          <td><span class="badge-scarlette-vendido">${c.unidades_asignadas} unidad(es)</span></td>
        </tr>
      `).join("");
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
            <td>
              <div style="color:#ffffff; font-weight:700; line-height:1.2">${u.nombre}</div>
              <div class="d-md-none" style="font-size:9px; color:#ffbce6; margin-top:1px">${u.modelo || 'TR-01'} · ${u.microcontrolador || 'ESP8266'}</div>
            </td>
            <td class="d-none d-md-table-cell"><span class="badge" style="background:#2a1a2b; border:1px solid #614765; color:#f6b5d8">${u.modelo || 'TR-01'}</span></td>
            <td><span class="hud-sn" style="white-space:nowrap; font-size:9.5px; padding:2px 5px">${u.numero_serie || 'S/N'}</span></td>
            <td class="d-none d-md-table-cell"><span class="badge" style="background:#1f192b; border:1px solid #5a4163; color:#e0d2ea">${u.microcontrolador || 'ESP8266'}</span></td>
            <td><span class="${badgeClass}" style="font-size:9.5px; padding:2px 6px">${u.estado_comercial.toUpperCase()}</span></td>
            <td>${u.propietario ? `<span class="badge-scarlette-usuario" style="font-size:9.5px; padding:2px 6px">${u.propietario}</span>` : '<em style="color:#a899b5; font-size:9.5px">Stock</em>'}</td>
            <td>
              <button class="outline-button-sm btn-asignar" data-id="${u.id_vehiculo}" style="padding:2px 7px; font-size:10px">
                ${u.id_propietario ? 'Reasignar' : 'Asignar'}
              </button>
            </td>
          </tr>
        `;
      }).join("");

      tbodyU.querySelectorAll(".btn-asignar").forEach(btn => {
        btn.addEventListener("click", () => {
          const idV = parseInt(btn.getAttribute("data-id"), 10);
          const unidad = unidades.find(x => Number(x.id_vehiculo) === idV);
          const formNueva = contenedor.querySelector("#form-nueva-unidad");
          const formAsignar = contenedor.querySelector("#form-asignar-unidad");
          const titulo = contenedor.querySelector("#titulo-asignar-unidad");
          const selCliente = contenedor.querySelector("#asignar-cliente-select");
          const selEstado = contenedor.querySelector("#asignar-estado-select");
          if (!formAsignar || !selCliente || !selEstado) return;

          unidadAsignandoId = idV;
          if (formNueva) formNueva.style.display = "none";
          if (titulo) titulo.textContent = `Asignar Unidad #${idV} (${unidad?.nombre || "Terreneitor"})`;

          const soloClientes = clientesCache.filter(c => c.rol === "usuario");
          selCliente.innerHTML = [
            `<option value="">Sin propietario (Stock / Exhibición)</option>`,
            ...soloClientes.map(c =>
              `<option value="${c.id_usuario}">#${c.id_usuario} — ${c.nombre_usuario} (${c.unidades_asignadas} u.)</option>`
            )
          ].join("");

          selCliente.value = unidad?.id_propietario ? String(unidad.id_propietario) : "";
          selEstado.value = unidad?.estado_comercial || (unidad?.id_propietario ? "vendido" : "disponible");
          formAsignar.style.display = "block";
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
          <td>
            <div style="color:#ffffff; font-weight:700">${m.nombre_modelo}</div>
            <div class="d-md-none text-muted" style="font-size:9px">${m.descripcion || '-'}</div>
          </td>
          <td><span class="badge" style="background:#2a1a2b; border:1px solid #614765; color:#f6b5d8; font-size:9.5px">${m.microcontrolador}</span></td>
          <td class="d-none d-md-table-cell" style="color:#d5cbe0; font-size:12px">${m.descripcion || '-'}</td>
        </tr>
      `).join("");
    }

    // Auditoría
    const auditoria = await cargarAuditoria();
    const tbodyA = contenedor.querySelector("#tbody-auditoria");
    if (tbodyA) {
      tbodyA.innerHTML = auditoria.map(a => `
        <tr>
          <td style="color:#d5cbe0; font-size:9.5px; font-family:monospace; white-space:nowrap">${a.fecha_hora ? a.fecha_hora.replace('T', ' ').substring(5, 16) : '-'}</td>
          <td style="color:#ffffff; font-weight:700; font-size:10px">${a.nombre_usuario || 'sistema'}</td>
          <td><span class="badge" style="background:#3a1532; border:1px solid #8a3463; color:var(--pink-light); font-size:9px; padding:1px 4px">${a.accion}</span></td>
          <td style="font-family:monospace; color:#f6b5d8; font-size:9.5px">${a.recurso}</td>
          <td class="d-none d-md-table-cell" style="color:#ded0e5; font-size:11px">${a.detalle || ''}</td>
          <td><span class="${a.resultado === 'EXITO' ? 'badge-scarlette-vendido' : 'badge-scarlette-exhibicion'}" style="font-size:9px; padding:1px 5px">${a.resultado}</span></td>
        </tr>
      `).join("");
    }
  }

  return Object.freeze({
    renderizarEn,
    recargarDatos
  });
})();
