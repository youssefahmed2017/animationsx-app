"use client";

import { useRef } from "react";

export default function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));
  }

  function handleChange(index: number, raw: string) {
    const chars = raw.replace(/\D/g, "");
    if (!chars) {
      setDigit(index, "");
      return;
    }
    if (chars.length > 1) {
      // Pasted or autofilled a run of digits starting at this box.
      const next = digits.slice();
      for (let i = 0; i < chars.length && index + i < length; i++) {
        next[index + i] = chars[i];
      }
      onChange(next.join(""));
      inputRefs.current[Math.min(index + chars.length, length - 1)]?.focus();
      return;
    }
    setDigit(index, chars);
    if (index < length - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          maxLength={length} // allows a full paste to land in one box, see handleChange
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-10 h-12 rounded-md border border-neutral-700 bg-neutral-900 text-center text-lg outline-none focus:border-neutral-500"
        />
      ))}
    </div>
  );
}
