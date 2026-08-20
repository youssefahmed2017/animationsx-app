// Shared between the client form and the server-side generator/route so both
// enforce the same limit. Kept dependency-free (unlike jsCssGenerator.ts,
// which pulls in the WASM sandbox) so it's safe to import from client code.
export const MAX_JS_LENGTH = 20_000;
