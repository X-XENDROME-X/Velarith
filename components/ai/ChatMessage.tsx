import { useMemo } from "react";
import { User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(message.timestamp),
    [message.timestamp]
  );

  return (
    <div
      className={cn(
        "flex gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border",
          "shadow-lg shadow-black/30",
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-purple-500 border-white/10"
            : "bg-gradient-to-br from-cyan-500 to-teal-500 border-white/10"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        ) : (
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-2 max-w-[78%] sm:max-w-[70%]",
          isUser && "items-end text-right"
        )}
      >
        {/* Role Label */}
        <div
          className={cn(
            "flex items-center gap-2 text-xs sm:text-sm text-muted-foreground/70",
            isUser && "flex-row-reverse"
          )}
        >
          <span className="font-medium tracking-wide">
            {isUser ? "You" : "Velarith AI"}
          </span>
          <span className="text-muted-foreground/50">{formattedTime}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-lg transition-all duration-300",
            "border bg-card/80 backdrop-blur",
            isUser
              ? "border-white/10 bg-gradient-to-br from-indigo-500/90 to-purple-500/90 text-white"
              : "border-white/5 bg-card/80 text-foreground/90"
          )}
        >
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}
