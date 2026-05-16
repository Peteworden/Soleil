export function toCanvasRadec(canvasXy, fov, canvas) {
    const ra = (0.5 - canvasXy.x / canvas.width) * fov.ra;
    const dec = (0.5 - canvasXy.y / canvas.height) * fov.dec;
    return { ra, dec };
}
//# sourceMappingURL=CanvasXy.js.map