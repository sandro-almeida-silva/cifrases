"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold sm:min-h-10";

function Modal({
  open,
  title,
  description,
  onClose,
  children,
  initialFocus,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  initialFocus: () => HTMLElement | null;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocus()?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, initialFocus]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: clicar no fundo é só um atalho de mouse; o teclado fecha com Esc (onCancel) e pelo botão Cancelar.
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-white/10 bg-surface p-5 text-foreground shadow-2xl backdrop:bg-black/70"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <h2 id={titleId} className="text-lg font-bold">
        {title}
      </h2>
      {description ? (
        <p id={descriptionId} className="mt-2 text-sm text-muted">
          {description}
        </p>
      ) : null}
      {open ? children : null}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  return (
    <Modal
      open={open}
      title={title}
      {...(description ? { description } : {})}
      onClose={onClose}
      initialFocus={() => cancelRef.current}
    >
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          ref={cancelRef}
          type="button"
          className={`${buttonBase} border border-control-border hover:bg-control-background-hover`}
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={`${buttonBase} bg-red-600 text-white hover:bg-red-500`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function TextDialog({
  open,
  title,
  label,
  initialValue,
  confirmLabel,
  onSubmit,
  onClose,
}: {
  open: boolean;
  title: string;
  label: string;
  initialValue: string;
  confirmLabel: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) onSubmit(value);
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      initialFocus={() => {
        inputRef.current?.select();
        return inputRef.current;
      }}
    >
      <form onSubmit={submit}>
        <label htmlFor={inputId} className="mt-4 block text-sm font-semibold">
          {label}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          className="mt-2 h-11 w-full rounded-xl border border-control-border bg-control-background px-3 text-sm text-foreground outline-none focus:border-brand/50"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={`${buttonBase} border border-control-border hover:bg-control-background-hover`}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`${buttonBase} bg-brand text-white disabled:opacity-50`}
            disabled={!value.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
