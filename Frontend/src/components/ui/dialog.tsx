import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className
      )}
      {...props}
    />
  );
}

function DialogSheetHandle({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'mx-auto mb-1 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden',
        className
      )}
    />
  );
}

const dialogContentVariants = {
  responsive: cn(
    'fixed inset-x-0 bottom-0 top-auto z-50 grid w-full max-w-full translate-x-0 translate-y-0 gap-4 overflow-y-auto overscroll-contain border border-b-0 bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg outline-none duration-200',
    'max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)))] rounded-t-2xl',
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
    'sm:inset-auto sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:max-h-[min(85dvh,calc(100dvh-2rem))] sm:max-w-[calc(100%-2rem)] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-6 sm:pb-6',
    'sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
    'sm:max-w-sm lg:max-w-lg'
  ),
  centered: cn(
    'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto overscroll-contain rounded-lg border bg-background p-4 shadow-lg outline-none duration-200',
    'max-h-[min(85dvh,calc(100dvh-2rem-env(safe-area-inset-bottom)))] pb-[max(1rem,env(safe-area-inset-bottom))]',
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'sm:max-w-sm sm:p-6 sm:pb-6 lg:max-w-lg'
  ),
  fullscreen: cn(
    'fixed z-50 flex flex-col gap-0 overflow-hidden border bg-background p-0 shadow-lg outline-none duration-200',
    'top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))]',
    'rounded-xl sm:inset-4',
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
  ),
} as const;

type DialogContentVariant = keyof typeof dialogContentVariants;

function DialogContent({
  className,
  children,
  showCloseButton = true,
  variant = 'responsive',
  showSheetHandle,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  variant?: DialogContentVariant;
  /** Show drag handle on mobile bottom sheet. Defaults to true for responsive variant. */
  showSheetHandle?: boolean;
}) {
  const shouldShowHandle = showSheetHandle ?? variant === 'responsive';

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-variant={variant}
        className={cn(dialogContentVariants[variant], className)}
        {...props}
      >
        {shouldShowHandle && <DialogSheetHandle />}
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              'ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer',
              variant === 'fullscreen'
                ? 'top-3 right-3 flex size-9 items-center justify-center [&_svg:not([class*="size-"])]:size-5'
                : 'top-3 right-3 flex size-8 items-center justify-center sm:size-auto [&_svg:not([class*="size-"])]:size-4'
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-2 pr-8 text-center sm:pr-0 sm:text-left',
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogSheetHandle,
  DialogTitle,
  DialogTrigger,
};
