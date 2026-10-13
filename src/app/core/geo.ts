/**
 * Rota un punto en espacio PDF (origen arriba-izquierda, Y hacia abajo) para
 * compensar el /Rotate de la página (por defecto 270: el plano real es apaisado).
 */
export function rotatePoint(x: number, y: number, rot: number): [number, number] {
  switch (((rot % 360) + 360) % 360) {
    case 90:
      return [-y, x];
    case 180:
      return [-x, -y];
    case 270:
      return [y, -x];
    default:
      return [x, y];
  }
}
