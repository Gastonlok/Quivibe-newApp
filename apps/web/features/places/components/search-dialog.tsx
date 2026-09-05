"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function SearchDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    closeButton = useRef<HTMLButtonElement>(null),
    titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    closeButton.current?.focus({ preventScroll: true });
  }, [title]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-gray-900 shadow-xl backdrop:bg-gray-950/40 backdrop:backdrop-blur-sm sm:inset-0 sm:m-auto sm:w-[calc(100%_-_2rem)] sm:max-w-2xl sm:rounded-3xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 sm:px-7">
        <h2 id={titleId} className="text-xl font-extrabold">
          {title}
        </h2>
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Fermer les filtres"
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-primary-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
