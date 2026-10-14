export const environment = {
  production: false,
  /**
   * Base de la API. El backend tiene CORS habilitado (allow_origins="*"),
   * así que se puede llamar directo desde otro origen.
   * Si prefieres usar el proxy de desarrollo (proxy.conf.json), deja "".
   */
  apiBase: 'http://127.0.0.1:8000',
};
