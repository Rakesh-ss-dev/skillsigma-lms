import { useRef, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  isFullscreen?: boolean;
  dismissable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true,
  isFullscreen = false,
  dismissable = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    if (!dismissable || !isOpen) return;
    const handleEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, dismissable]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : "relative w-full max-w-3xl rounded-3xl bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto"; // ✅ internal scroll

  const canClose = showCloseButton && dismissable;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-400/50 backdrop-blur-[32px]">
      <div
        ref={modalRef}
        className={`${contentClasses} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {canClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-50 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M6.04 16.54a.9.9 0 0 0 1.42 1.42l4.54-4.54 4.54 4.54a.9.9 0 0 0 1.42-1.42L13.42 12l4.54-4.54a.9.9 0 1 0-1.42-1.42L12 10.58 7.46 6.04a.9.9 0 1 0-1.42 1.42L10.58 12l-4.54 4.54Z"
              />
            </svg>
          </button>
        )}
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
};
