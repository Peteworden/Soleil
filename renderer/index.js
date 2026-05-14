import { CanvasRenderer } from './CanvasRenderer.js';
import { WebGLRenderer } from './webgl/webglRenderer.js';
export function createRenderer(type, canvas, config) {
    if (type === 'webgl') {
        try {
            return new WebGLRenderer(canvas, config);
        }
        catch (_) {
            // Fallback to Canvas when WebGL2 is unavailable
            return new CanvasRenderer(canvas);
        }
    }
    return new CanvasRenderer(canvas);
}
//# sourceMappingURL=index.js.map