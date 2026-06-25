/** Exported memory */
export declare const memory: WebAssembly.Memory;
// Exported runtime interface
export declare function __new(size: number, id: number): number;
export declare function __pin(ptr: number): number;
export declare function __unpin(ptr: number): void;
export declare function __collect(): void;
export declare const __rtti_base: number;
/**
 * assembly/astroCalculation/allocF64Array
 * @param n `i32`
 * @returns `usize`
 */
export declare function allocF64Array(n: number): number;
/**
 * assembly/astroCalculation/wasmEquatorialToHorizontal
 * @param lst `f64`
 * @param lat `f64`
 * @param raArray `usize`
 * @param decArray `usize`
 * @param n `i32`
 * @param result `usize`
 */
export declare function wasmEquatorialToHorizontal(lst: number, lat: number, raArray: number, decArray: number, n: number, result: number): void;
/**
 * assembly/astroCalculation/wasmEquatorialToHorizontalSingle
 * @param lst `f64`
 * @param lat `f64`
 * @param ra `f64`
 * @param dec `f64`
 * @param result `usize`
 */
export declare function wasmEquatorialToHorizontalSingle(lst: number, lat: number, ra: number, dec: number, result: number): void;
/**
 * assembly/astroCalculation/wasmEquatorialToScreenRaDec
 * @param lst `f64`
 * @param lat `f64`
 * @param mode `i32`
 * @param centerRA `f64`
 * @param centerDec `f64`
 * @param centerAz `f64`
 * @param centerAlt `f64`
 * @param raArray `usize`
 * @param decArray `usize`
 * @param n `i32`
 * @param result `usize`
 */
export declare function wasmEquatorialToScreenRaDec(lst: number, lat: number, mode: number, centerRA: number, centerDec: number, centerAz: number, centerAlt: number, raArray: number, decArray: number, n: number, result: number): void;
/**
 * assembly/astroCalculation/wasmEquatorialToScreenRaDecSingle
 * @param lst `f64`
 * @param lat `f64`
 * @param mode `i32`
 * @param centerRA `f64`
 * @param centerDec `f64`
 * @param centerAz `f64`
 * @param centerAlt `f64`
 * @param ra `f64`
 * @param dec `f64`
 * @param result `usize`
 */
export declare function wasmEquatorialToScreenRaDecSingle(lst: number, lat: number, mode: number, centerRA: number, centerDec: number, centerAz: number, centerAlt: number, ra: number, dec: number, result: number): void;
