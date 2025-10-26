// @ts-ignore
import * as loader from "../../loader/index.js";
export async function loadWasm() {
    const response = await fetch("../../wasm/build/release.wasm");
    const wasmModule = await loader.instantiateStreaming(response);
    return wasmModule.exports;
}
//# sourceMappingURL=wasmLoader.js.map