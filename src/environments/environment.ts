export const environment = {
  production: false,
  /**
   * Base de la API.
   * Dejado vacío para usar el proxy de desarrollo (proxy.conf.json) y evitar CORS.
   * Si quieres apuntar directo al backend, usa "http://localhost:8000"
   * (requiere CORSMiddleware en api/main.py).
   */
  apiBase: '',
};
