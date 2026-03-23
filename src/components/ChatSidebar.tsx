"use client";

import { useState } from "react";

export type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type Props = {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  busy: boolean;
  initializing?: boolean;
};

export function ChatSidebar({
  messages,
  onSend,
  busy,
  initializing = false,
}: Props) {
  const [text, setText] = useState("");

  async function submit() {
    const t = text.trim();
    if (!t || busy || initializing) return;
    setText("");
    await onSend(t);
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Chat with Graph</h2>
        <p className="text-xs text-gray-500">Order to Cash</p>
      </div>

      <div className="flex items-center gap-3 border-b border-gray-50 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
          D
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">Dodge AI</p>
          <p className="text-xs text-gray-500">Graph Agent</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {initializing && messages.length === 0 ? (
          <p className="text-sm text-gray-500">Loading graph from dataset…</p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={
              m.role === "user"
                ? "ml-6 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900"
                : "mr-4 text-sm leading-relaxed text-gray-800"
            }
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {initializing
            ? "Loading graph…"
            : busy
              ? "Dodge AI is thinking…"
              : "Dodge AI is awaiting instructions."}
        </div>
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Analyze anything."
            rows={3}
            disabled={busy || initializing}
            className="min-h-[88px] flex-1 resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2 disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || initializing || !text.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}
