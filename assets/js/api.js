"use strict";

// Cliente HTTP de SCARLETTE TERRENEITOR.
// No almacenar contraseñas ni API Keys en este archivo.

window.SCARLETTE_API = (() => {
  const config = window.SCARLETTE_CONFIG;
  const CLAVE_SESION = "scarlette_access_token";
  const CLAVE_GUEST = "scarlette_guest_token";

  let tokenSesion = sessionStorage.getItem(CLAVE_SESION);
  let tokenInvitado = sessionStorage.getItem(CLAVE_GUEST);

  function establecerToken(token) {
    tokenSesion = token || null;

    if (tokenSesion) {
      sessionStorage.setItem(CLAVE_SESION, tokenSesion);
    } else {
      sessionStorage.removeItem(CLAVE_SESION);
    }
  }

  function obtenerToken() {
    return tokenSesion;
  }

  function establecerTokenInvitado(token) {
    tokenInvitado = token || null;

    if (tokenInvitado) {
      sessionStorage.setItem(CLAVE_GUEST, tokenInvitado);
    } else {
      sessionStorage.removeItem(CLAVE_GUEST);
    }
  }

  function obtenerTokenInvitado() {
    return tokenInvitado;
  }

  function limpiarToken() {
    establecerToken(null);
    establecerTokenInvitado(null);
  }

  async function solicitar(ruta, opciones = {}) {
    const controlador = new AbortController();

    const timeout = setTimeout(
      () => controlador.abort(),
      config.REQUEST_TIMEOUT_MS
    );

    const encabezados = new Headers(opciones.headers || {});

    if (tokenSesion) {
      encabezados.set("Authorization", `Bearer ${tokenSesion}`);
    }

    if (tokenInvitado) {
      encabezados.set("X-Guest-Token", tokenInvitado);
    }

    if (opciones.body !== undefined && !(opciones.body instanceof FormData)) {
      encabezados.set("Content-Type", "application/json");
    }

    try {
      const respuesta = await fetch(
        `${config.API_BASE_URL}${ruta}`,
        {
          ...opciones,
          headers: encabezados,
          signal: controlador.signal,
          cache: "no-store"
        }
      );

      const contenido = await respuesta.text();
      let datos = null;

      if (contenido) {
        try {
          datos = JSON.parse(contenido);
        } catch {
          throw new Error("La API devolvió una respuesta no válida.");
        }
      }

      if (!respuesta.ok) {
        let detalle = datos?.detail;

        if (Array.isArray(detalle)) {
          detalle = detalle.map(item => item.msg).join("; ");
        }

        if (typeof detalle !== "string") {
          detalle = `Error HTTP ${respuesta.status}`;
        }

        const error = new Error(detalle);
        error.status = respuesta.status;
        throw error;
      }

      return datos;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("La solicitud superó el tiempo de espera.");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return Object.freeze({
    solicitar,
    establecerToken,
    obtenerToken,
    establecerTokenInvitado,
    obtenerTokenInvitado,
    limpiarToken
  });
})();
