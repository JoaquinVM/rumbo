// Types of the v1 oracle loader (motor.mjs). The v1 is untyped JavaScript: its functions come back as `any`.
export declare const FUNCIONES: readonly string[];
export declare function cargarMotor(opciones?: { hoy?: string }): Record<string, any>;
