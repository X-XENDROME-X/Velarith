import { useMemo, useState } from "react";
import { User, Sparkles, Copy, CheckCheck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  
  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(message.timestamp),
    [message.timestamp]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 group",
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
          {isUser ? (
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-p:my-2 prose-h1:text-xl prose-h1:sm:text-2xl prose-h1:font-bold prose-h1:mt-4 prose-h1:mb-3 prose-h2:text-lg prose-h2:sm:text-xl prose-h2:font-semibold prose-h2:mt-3 prose-h2:mb-2 prose-h3:text-base prose-h3:sm:text-lg prose-h3:font-medium prose-h3:mt-3 prose-h3:mb-2 prose-headings:text-cyan-100 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10 prose-code:text-cyan-300 prose-code:bg-black/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-strong:text-white/95 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-td:p-2 prose-th:p-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Message Actions */}
        <div
          className={cn(
            "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser && "flex-row-reverse"
          )}
        >
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-card/50 border border-white/5 hover:bg-card/80 hover:border-white/10 transition-all text-muted-foreground hover:text-foreground"
            title="Copy message"
          >
            {copied ? (
              <CheckCheck className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          
          {!isUser && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1.5 rounded-lg bg-card/50 border border-white/5 hover:bg-card/80 hover:border-cyan-500/20 transition-all text-muted-foreground hover:text-cyan-400"
              title="Regenerate response"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
