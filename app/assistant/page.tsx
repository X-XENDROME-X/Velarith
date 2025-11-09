"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/components/ai/ChatMessage";
import { ChatInput } from "@/components/ai/ChatInput";
import { SuggestedPrompts } from "@/components/ai/SuggestedPrompts";
import { Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm your AI assistant for prediction market analytics. I can help you analyze market trends, understand probabilities, and make informed decisions. How can I assist you today?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handlePromptSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

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
                <div className="space-y-6 rounded-3xl border border-white/5 bg-card/70 p-4 sm:p-6 shadow-xl shadow-black/20">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-200">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:120ms]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:240ms]" />
                      </div>
                      <span>Velarith AI is thinking...</span>
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
