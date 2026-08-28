'use client';

import React, {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

let bodyScrollLockCount = 0;
let bodyOverflowBeforeLock = '';
const openDialogStack = [];

const lockBodyScroll = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (bodyScrollLockCount === 0) {
    bodyOverflowBeforeLock =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';
  }

  bodyScrollLockCount += 1;
};

const unlockBodyScroll = () => {
  if (
    typeof document === 'undefined' ||
    bodyScrollLockCount <= 0
  ) {
    return;
  }

  bodyScrollLockCount -= 1;

  if (bodyScrollLockCount === 0) {
    document.body.style.overflow =
      bodyOverflowBeforeLock;

    bodyOverflowBeforeLock = '';
  }
};

const pushOpenDialog = (dialogId) => {
  const currentIndex =
    openDialogStack.indexOf(
      dialogId
    );

  if (currentIndex !== -1) {
    openDialogStack.splice(
      currentIndex,
      1
    );
  }

  openDialogStack.push(dialogId);
};

const removeOpenDialog = (dialogId) => {
  const currentIndex =
    openDialogStack.lastIndexOf(
      dialogId
    );

  if (currentIndex !== -1) {
    openDialogStack.splice(
      currentIndex,
      1
    );
  }
};

const isTopDialog = (dialogId) =>
  openDialogStack[
    openDialogStack.length - 1
  ] === dialogId;

const getFocusableElements = (
  container
) => {
  if (!container) {
    return [];
  }

  return [
    ...container.querySelectorAll(
      FOCUSABLE_SELECTOR
    ),
  ].filter(
    (element) =>
      !element.closest(
        '[aria-hidden="true"]'
      )
  );
};

const AdaptiveDialog = ({
  title,
  description,
  children,
  footer,
  onClose,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  isOpen = true,
  ariaLabel = 'پنجره گفتگو',
  panelClassName = '',
  bodyClassName = '',
}) => {
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const reactId = useId();

  const dialogInstanceId =
    `adaptive-dialog-${reactId}`;

  const titleId =
    `${dialogInstanceId}-title`;

  const descriptionId =
    `${dialogInstanceId}-description`;

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (
      !mounted ||
      !isOpen
    ) {
      return undefined;
    }

    const previouslyFocused =
      document.activeElement;

    restoreFocusRef.current =
      previouslyFocused instanceof
      HTMLElement
        ? previouslyFocused
        : null;

    pushOpenDialog(
      dialogInstanceId
    );

    lockBodyScroll();

    const focusInitialElement = () => {
      if (
        !isTopDialog(
          dialogInstanceId
        )
      ) {
        return;
      }

      const panel =
        panelRef.current;

      const focusableElements =
        getFocusableElements(
          panel
        );

      const firstFocusable =
        focusableElements[0];

      if (firstFocusable) {
        firstFocusable.focus();
        return;
      }

      panel?.focus();
    };

    /*
     * Portal DOM در همین commit ساخته می‌شود؛
     * یک frame صبر می‌کنیم تا focus بعد از layout
     * روی عنصر واقعی dialog قرار بگیرد.
     */
    const focusFrame =
      window.requestAnimationFrame(
        focusInitialElement
      );

    const handleKeyDown = (event) => {
      if (
        !isTopDialog(
          dialogInstanceId
        )
      ) {
        return;
      }

      if (
        event.key === 'Escape' &&
        closeOnEscape
      ) {
        event.preventDefault();
        event.stopPropagation();

        onClose?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const panel =
        panelRef.current;

      const focusableElements =
        getFocusableElements(
          panel
        );

      if (
        focusableElements.length === 0
      ) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const firstFocusable =
        focusableElements[0];

      const lastFocusable =
        focusableElements[
          focusableElements.length - 1
        ];

      const activeElement =
        document.activeElement;

      if (
        event.shiftKey &&
        (
          activeElement ===
            firstFocusable ||
          !panel?.contains(
            activeElement
          )
        )
      ) {
        event.preventDefault();
        lastFocusable.focus();
        return;
      }

      if (
        !event.shiftKey &&
        (
          activeElement ===
            lastFocusable ||
          !panel?.contains(
            activeElement
          )
        )
      ) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown,
      true
    );

    return () => {
      window.cancelAnimationFrame(
        focusFrame
      );

      document.removeEventListener(
        'keydown',
        handleKeyDown,
        true
      );

      removeOpenDialog(
        dialogInstanceId
      );

      unlockBodyScroll();

      const elementToRestore =
        restoreFocusRef.current;

      restoreFocusRef.current = null;

      if (
        elementToRestore &&
        document.contains(
          elementToRestore
        )
      ) {
        elementToRestore.focus();
      }
    };
  }, [
    mounted,
    isOpen,
    closeOnEscape,
    dialogInstanceId,
    onClose,
  ]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          dir='rtl'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className='fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 pt-8 backdrop-blur-sm md:items-center md:px-4 md:py-6'
          onMouseDown={(event) => {
            if (
              closeOnBackdrop &&
              event.target === event.currentTarget
            ) {
              onClose?.();
            }
          }}
        >
          <motion.div
            ref={panelRef}
            role='dialog'
            aria-modal='true'
            aria-labelledby={
              title
                ? titleId
                : undefined
            }
            aria-describedby={
              description
                ? descriptionId
                : undefined
            }
            aria-label={
              title
                ? undefined
                : ariaLabel
            }
            tabIndex={-1}
            initial={{
              opacity: 0,
              y: 36,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 36,
              scale: 0.985,
            }}
            transition={{
              duration: 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={[
          'relative flex min-h-0 w-full flex-col overflow-hidden',
          'max-h-[calc(100dvh-2rem)]',
          'rounded-t-[28px]',
          'border border-black/5',
          'bg-surface-light',
          'shadow-[0_-20px_60px_rgba(15,23,42,0.12)]',
          'md:max-h-[calc(100dvh-3rem)]',
          'md:max-w-[720px]',
          'md:rounded-[28px]',
          'md:shadow-[0_24px_75px_rgba(15,23,42,0.12)]',
          'dark:border-white/10',
          'dark:bg-surface-dark',
          'dark:shadow-[0_24px_75px_rgba(0,0,0,0.28)]',
          panelClassName,
        ].join(' ')}
      >
        <div
          aria-hidden='true'
          className='flex shrink-0 justify-center pb-1 pt-2.5 md:hidden'
        >
          <span className='h-1 w-10 rounded-full bg-black/15 dark:bg-white/20' />
        </div>

        {(title || description || showCloseButton) && (
          <div className='flex shrink-0 items-start gap-3 border-b border-black/5 px-4 pb-4 pt-3 sm:px-5 md:px-6 md:py-5 dark:border-white/10'>
            <div className='min-w-0 flex-1'>
              {title && (
                <h2
                  id={titleId}
                  className='text-sm font-black leading-7 text-text-light sm:text-base dark:text-text-dark'
                >
                  {title}
                </h2>
              )}

              {description && (
                <p
                  id={descriptionId}
                  className='mt-1 text-xs leading-6 text-subtext-light sm:text-sm sm:leading-7 dark:text-subtext-dark'
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type='button'
                onClick={onClose}
                aria-label='بستن'
                className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-subtext-light transition hover:bg-black/5 hover:text-text-light dark:text-subtext-dark dark:hover:bg-white/10 dark:hover:text-text-dark'
              >
                <IoClose size={22} />
              </button>
            )}
          </div>
        )}

        <div
          className={[
            'min-h-0 flex-1 overflow-y-auto overscroll-contain',
            'px-4 py-4 sm:px-5 md:px-6 md:py-5',
            bodyClassName,
          ].join(' ')}
          style={
            footer
              ? undefined
              : {
                  paddingBottom:
                    'max(1rem, env(safe-area-inset-bottom))',
                }
          }
        >
          {children}
        </div>

        {footer && (
          <div
            className='shrink-0 border-t border-black/5 bg-background-light/40 px-4 pt-3 sm:px-5 md:px-6 md:py-4 dark:border-white/10 dark:bg-background-dark/25'
            style={{
              paddingBottom:
                'max(0.75rem, env(safe-area-inset-bottom))',
            }}
          >
            {footer}
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

AdaptiveDialog.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  closeOnBackdrop: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  isOpen: PropTypes.bool,
  ariaLabel: PropTypes.string,
  panelClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
};

export default AdaptiveDialog;
