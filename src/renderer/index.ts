import { StarChartConfig } from '../types/index.js';
import { CanvasRenderer } from './CanvasRenderer.js';
import { WebGLRenderer } from './webgl/webglRenderer.js';

export type RendererType = 'canvas' | 'webgl';

export function createRenderer(type: RendererType, canvas: HTMLCanvasElement, config: StarChartConfig) {
    if (type === 'webgl') {
        try {
            return new WebGLRenderer(canvas, config);
        } catch (_) {
            // Fallback to Canvas when WebGL2 is unavailable
            return new CanvasRenderer(canvas, config);
        }
    }
    return new CanvasRenderer(canvas, config);
}