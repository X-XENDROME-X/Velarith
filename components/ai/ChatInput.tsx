"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 2000;

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const remainingChars = maxLength - input.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground/70 sm:text-xs">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/50 px-2.5 py-1">
          <Sparkles className="h-3 w-3 text-cyan-300" />
          <span className="font-medium tracking-wide">Velarith Insight Mode</span>
        </div>
        <span>{remainingChars} characters left</span>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about prediction markets..."
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none rounded-2xl border border-white/10 bg-transparent px-3.5 py-3.5 sm:px-5 sm:py-4",
                "text-sm leading-relaxed text-foreground/90 sm:text-[15px]",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/60",
                "placeholder:text-muted-foreground/60",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "min-h-[60px] max-h-[200px] sm:min-h-[64px]",
                isOverLimit && "border-red-500/80 focus:ring-red-500/40"
              )}
            />
            {/* Over limit indicator */}
            {isOverLimit && (
              <span className="absolute bottom-2 right-3 text-xs font-medium text-red-500">
                Limit exceeded
              </span>
            )}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || !input.trim() || isOverLimit}
            size="lg"
            className={cn(
              "rounded-2xl h-[48px] px-5 sm:h-full sm:min-h-[60px] sm:px-7",
              "bg-gradient-to-r from-cyan-500 via-teal-500 to-purple-500",
              "hover:from-cyan-400 hover:via-teal-400 hover:to-purple-400",
              "text-white font-semibold tracking-wide",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
            )}
          >
            {disabled ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                <span className="hidden sm:inline">Send</span>
              </div>
            )}
          </Button>
        </div>

      {/* Helper Text */}
      <p className="px-1 text-center text-[11px] text-muted-foreground/70 sm:text-xs">
        Velarith AI may miss context—double-check crucial trades with your trusted sources.
      </p>
    </div>
  );
}
