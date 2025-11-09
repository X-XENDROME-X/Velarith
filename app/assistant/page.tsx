"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/ai/ChatMessage";
import { ChatInput } from "@/components/ai/ChatInput";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import { Sparkles, AlertCircle, Trash2, Download, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isIncomplete, setIsIncomplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Clear any previous errors
    setError(null);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    
    // Update messages state and get the new array
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    setIsLoading(true);
    setStreamingContent("");

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let responseIncomplete = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                // Stream complete
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullContent += parsed.text;
                  setStreamingContent(fullContent);
                }
                // Check if response was incomplete
                if (parsed.done && parsed.incomplete) {
                  responseIncomplete = true;
                }
              } catch (e) {
                console.error("Failed to parse chunk:", e);
              }
            }
          }
        }
      }

      // Add complete assistant message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullContent + (responseIncomplete ? "\n\n⚠️ *Response truncated due to length. Ask a follow-up question for more details.*" : ""),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setStreamingContent("");

      // Show warning if response was incomplete
      if (responseIncomplete) {
        setError("Response was truncated due to length. The analysis is complete but may benefit from a follow-up question for additional details.");
        setTimeout(() => setError(null), 8000); // Auto-dismiss after 8 seconds
      }
      setIsIncomplete(responseIncomplete);

    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Request cancelled");
      } else {
        console.error("Chat error:", err);
        setError(err.message || "Failed to get response. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handlePromptSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear all messages?")) {
      setMessages([]);
      setError(null);
      setStreamingContent("");
    }
  };

  const handleExportChat = () => {
    const chatText = messages
      .map((msg) => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        const role = msg.role === "user" ? "You" : "Velarith AI";
        return `[${timestamp}] ${role}:\n${msg.content}\n`;
      })
      .join("\n---\n\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `velarith-chat-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRegenerateLastResponse = () => {
    // Find the last user message
    const lastUserMessageIndex = messages.findLastIndex(
      (msg) => msg.role === "user"
    );
    if (lastUserMessageIndex === -1) return;

    // Remove all messages after the last user message
    const messagesUpToLastUser = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(messagesUpToLastUser);

    // Resend the last user message
    const lastUserMessage = messages[lastUserMessageIndex];
    handleSendMessage(lastUserMessage.content);
  };

  const handleContinueResponse = () => {
    // Add continuation prompt
    const continuePrompt = "Please continue from where you left off and complete your analysis.";
    handleSendMessage(continuePrompt);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, streamingContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/5 bg-card/70 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/20 via-teal-500/20 to-purple-500/20 p-2">
              <Sparkles className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-xl font-semibold sm:text-2xl">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Your intelligent market analysis companion
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportChat}
                className="rounded-lg border border-white/10 bg-card/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-cyan-500/30 hover:bg-card/80 hover:text-cyan-400"
                title="Export chat"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={handleClearChat}
                className="rounded-lg border border-white/10 bg-card/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-red-500/30 hover:bg-card/80 hover:text-red-400"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.15),_transparent_55%)]" />
        <div className="relative h-full overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
                {/* Welcome Card */}
                <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-900/40 via-slate-900/70 to-purple-900/40 p-8 text-center shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.25),_transparent_60%)]" />
                  <div className="relative space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/40 bg-white/5">
                      <Sparkles className="h-8 w-8 text-cyan-300" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome to Velarith AI</h2>
                    <p className="mx-auto max-w-2xl text-base text-muted-foreground/80 sm:text-lg">
                      Get instant insights, market analysis, and predictions powered by advanced AI. Ask
                      anything about prediction markets and receive tailored answers in seconds.
                    </p>
                  </div>
                </div>

                {/* Suggested Prompts */}
                <SuggestedPrompts
                  className="max-w-4xl"
                  onPromptSelect={handlePromptSelect}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-6">
                {/* Error Banner */}
                {error && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-rose-200 mb-1">Error</h4>
                      <p className="text-sm text-rose-300/90">{error}</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-rose-400 hover:text-rose-300 text-sm"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="space-y-6 rounded-3xl border border-white/5 bg-card/70 p-4 sm:p-6 shadow-xl shadow-black/20">
                  {messages.map((message, index) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message}
                      onRegenerate={
                        message.role === "assistant" && 
                        index === messages.length - 1 && 
                        !isLoading
                          ? handleRegenerateLastResponse
                          : undefined
                      }
                    />
                  ))}
                  
                  {/* Streaming message */}
                  {streamingContent && (
                    <ChatMessage 
                      message={{
                        id: "streaming",
                        role: "assistant",
                        content: streamingContent,
                        timestamp: new Date(),
                      }}
                    />
                  )}
                  
                  {/* Loading indicator with enhanced animation */}
                  {isLoading && !streamingContent && (
                    <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 px-5 py-4">
                      <div className="relative flex h-8 w-8 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                        <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-cyan-200">
                          Velarith AI is analyzing...
                        </p>
                        <p className="text-xs text-cyan-300/60">
                          Fetching market data and generating insights
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Continue button for incomplete responses */}
                  {isIncomplete && !isLoading && (
                    <div className="flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <button
                        onClick={handleContinueResponse}
                        className="group flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 px-6 py-3 text-sm font-medium text-cyan-200 shadow-lg transition-all hover:border-cyan-400/50 hover:from-cyan-500/20 hover:via-teal-500/20 hover:to-cyan-500/20 hover:shadow-cyan-500/25"
                      >
                        <Sparkles className="h-4 w-4 text-cyan-400 group-hover:animate-pulse" />
                        Continue Response
                        <span className="text-xs text-cyan-400/70">(Response was truncated)</span>
                      </button>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
