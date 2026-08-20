import { getQuickJS, shouldInterruptAfterDeadline } from "quickjs-emscripten";
import { MAX_JS_LENGTH } from "@/lib/jsGeneratorLimits";

const TIME_BUDGET_MS = 500;
const MEMORY_LIMIT_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_OUTPUT_LENGTH = 50_000; // matches validateCss's MAX_CSS_LENGTH

/**
 * Runs untrusted JS in a QuickJS-in-WASM sandbox to procedurally produce a CSS
 * string (e.g. generating repetitive @keyframes steps). The sandbox has zero
 * ambient I/O by construction — no fetch, no fs, no process, no access to this
 * process's env vars — so this is safe to run without further isolation, unlike
 * eval()/vm/Function() which all share the host's capabilities.
 *
 * Contract: the script's last expression must evaluate to a string. That
 * string is treated as untrusted CSS and must still pass validateCss()
 * downstream, same as hand-written CSS.
 */
export async function generateCssFromJs(
  source: string
): Promise<{ css: string } | { error: string }> {
  if (!source.trim()) {
    return { error: "JS source is empty." };
  }
  if (source.length > MAX_JS_LENGTH) {
    return { error: `JS source is too large (max ${MAX_JS_LENGTH.toLocaleString()} characters).` };
  }

  const QuickJS = await getQuickJS();

  let result: unknown;
  try {
    result = QuickJS.evalCode(source, {
      shouldInterrupt: shouldInterruptAfterDeadline(Date.now() + TIME_BUDGET_MS),
      memoryLimitBytes: MEMORY_LIMIT_BYTES,
    });
  } catch (err) {
    // QuickJS converts in-VM exceptions to plain objects shaped like Errors
    // (name/message/stack) rather than real Error instances, so `instanceof
    // Error` doesn't work here — check for a `message` property instead.
    const message =
      err && typeof err === "object" && "message" in err && typeof err.message === "string"
        ? err.message
        : String(err);

    if (message === "interrupted") {
      return { error: `Generator took too long to run (max ${TIME_BUDGET_MS}ms).` };
    }
    if (message === "out of memory") {
      return { error: "Generator used too much memory." };
    }
    return { error: `Generator threw an error: ${message}` };
  }

  if (typeof result !== "string") {
    return {
      error:
        "Generator must evaluate to a CSS string (the last expression in your script becomes the result).",
    };
  }
  if (result.length > MAX_OUTPUT_LENGTH) {
    return {
      error: `Generated CSS is too large (max ${MAX_OUTPUT_LENGTH.toLocaleString()} characters).`,
    };
  }

  return { css: result };
}
