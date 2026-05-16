import { CanvasRadecCoords, CanvasSize, CanvasXy, Fov } from "../../types/index.js";

export function toCanvasRadec(canvasXy: CanvasXy, fov: Fov, canvas: CanvasSize): CanvasRadecCoords {
    const ra = (0.5 - canvasXy.x / canvas.width) * fov.ra;
    const dec = (0.5 - canvasXy.y / canvas.height) * fov.dec;
    return { ra, dec };
}