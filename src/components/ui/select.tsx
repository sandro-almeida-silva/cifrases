"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SelectProps<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
};

export function Select<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  disabled = false,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlightedValue, setHighlightedValue] = useState(value);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];
  const highlightedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === highlightedValue),
  );

  useEffect(() => {
    setHighlightedValue(value);
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectValue(nextValue: T) {
    onChange(nextValue);
    setHighlightedValue(nextValue);
    setOpen(false);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlightedValue(value);
        return;
      }

      const nextIndex =
        event.key === "ArrowDown"
          ? Math.min(highlightedIndex + 1, options.length - 1)
          : Math.max(highlightedIndex - 1, 0);
      setHighlightedValue(options[nextIndex]?.value ?? value);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      if (!open) setOpen(true);
      const nextIndex = event.key === "Home" ? 0 : options.length - 1;
      setHighlightedValue(options[nextIndex]?.value ?? value);
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      selectValue(highlightedValue);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      setHighlightedValue(value);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        className="ui-select inline-flex w-full items-center justify-between gap-3 text-left"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
            setHighlightedValue(value);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="min-w-0 truncate">{selected?.label ?? "Selecionar"}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-[calc(100%+0.35rem)] z-50 w-full min-w-48 overflow-hidden rounded-xl border border-control-border bg-panel p-1 shadow-2xl shadow-black/40"
        >
          {options.map((option) => {
            const highlighted = option.value === highlightedValue;
            const selectedOption = option.value === value;

            return (
              <button
                key={option.value}
                id={`${listboxId}-option-${option.value}`}
                type="button"
                role="option"
                aria-selected={selectedOption}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  highlighted
                    ? "bg-brand/15 text-foreground"
                    : "text-foreground hover:bg-control-background-hover"
                }`}
                onMouseEnter={() => setHighlightedValue(option.value)}
                onClick={() => selectValue(option.value)}
              >
                <span>{option.label}</span>
                {selectedOption ? <Check aria-hidden="true" className="size-4 text-brand-soft" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
