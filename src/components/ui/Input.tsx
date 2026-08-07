import { forwardRef } from "react";
import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const FIELD_CLASSES =
  "w-full box-border rounded-xl border border-border-strong bg-white/5 px-3 py-2.5 text-xs text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(FIELD_CLASSES, error && "border-red-400/60", className)}
        {...props}
      />
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(FIELD_CLASSES, "resize-none", error && "border-red-400/60", className)}
        {...props}
      />
      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[11px] text-white/45", className)}
      {...props}
    />
  );
}
