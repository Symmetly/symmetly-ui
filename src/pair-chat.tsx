"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Greeting } from "./greeting";
import { DocIcon } from "./icons";

export type PairOrg = { id: string; name: string; remaining: number; source?: "organisation" | "personal" };
export type PairMode = { id: string; label: string; placeholder: string; suggestions: string[] };

// The three modes of the prototype. "Ask about this page" only makes sense where there is a page to
// ask about, so without a context (the Pair page itself) the wording is general.
export function defaultPairModes(hasPage: boolean): PairMode[] {
  return [
    {
      id: "ask",
      label: "Ask",
      placeholder: hasPage ? "Ask about this page…" : "Ask anything…",
      suggestions: hasPage ? ["What can you help me with here?", "Summarise what I am looking at"] : ["What can you help me with?", "Help me plan my week"],
    },
    { id: "how", label: "How to?", placeholder: "How do I…", suggestions: ["How do I print a plan?", "How do I invite a colleague?"] },
    { id: "gen", label: "Generate", placeholder: "Describe what to generate…", suggestions: ["Suggest a warm-up activity", "Write differentiation ideas"] },
  ];
}

const OUT_OF_CREDITS = new Set(["AI002", "AI003"]);

type Props = {
  /** The chat endpoint of the host app (each host has its own, same origin). */
  api?: string;
  /** Pair icon for the greeting and the answers. */
  icon: string;
  /** First name for "Good morning, Hana". */
  name: string;
  orgs: PairOrg[];
  /** The organisation to start in (a stored conversation is fixed to its own). */
  orgId?: string;
  /** Which product's tools to use; the host sets it. */
  product?: string;
  /** The page the person is on: shown as the chip above the composer and sent with each message. */
  context?: { label: string; data?: unknown };
  modes?: PairMode[];
  /** A stored conversation to continue. Without it a new one starts. */
  conversation?: { id: string; messages: UIMessage[]; locked?: boolean };
  /** Reads the balance after each answer (a server action of the host). */
  getBalance?: (orgId: string) => Promise<{ remaining?: number } | null>;
  /** Called after the first answer of a new conversation has been saved. */
  onSaved?: (id: string) => void;
  /** Where "Top up credits" goes. */
  topUpHref?: string;
};

// The Pair chat: greeting with modes and suggestions, the thread, and the composer. It lives in the
// slide-in panel of every app (pass it to <Shell pair>) and, wider, on the full Pair page.
export function PairChat(props: Props) {
  // "New chat" remounts the inner chat, which starts a fresh conversation.
  const [round, setRound] = useState(0);
  const continuing = round === 0 ? props.conversation : undefined;
  return (
    <ChatInner
      key={round}
      {...props}
      initialMessages={continuing?.messages ?? []}
      locked={!!continuing?.locked}
      onNew={() => setRound((r) => r + 1)}
    />
  );
}

function ChatInner({
  api = "/api/pair",
  icon,
  name,
  orgs,
  orgId: startOrg,
  product,
  context,
  modes: modesProp,
  getBalance,
  onSaved,
  topUpHref,
  conversation,
  initialMessages,
  locked,
  onNew,
}: Props & { initialMessages: UIMessage[]; locked: boolean; onNew: () => void }) {
  const [orgId, setOrgId] = useState(startOrg ?? orgs[0]?.id ?? "");
  const [remaining, setRemaining] = useState<Record<string, number>>(() => Object.fromEntries(orgs.map((o) => [o.id, o.remaining])));
  const modes = useMemo(() => modesProp ?? defaultPairModes(!!context), [modesProp, context]);
  const [modeId, setModeId] = useState(modes[0].id);
  const mode = modes.find((m) => m.id === modeId) ?? modes[0];
  const [text, setText] = useState("");
  const thread = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  // The conversation id is made when the first message is sent (an event, not during render, so it
  // also works while the page is prerendered). Only the newest message travels; the server keeps the history.
  const placeholder = useId();
  const convId = useRef<string | undefined>(conversation?.id);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api,
        prepareSendMessagesRequest({ messages, body }) {
          convId.current ??= crypto.randomUUID();
          return { body: { ...body, id: convId.current, message: messages[messages.length - 1] } };
        },
      }),
    [api],
  );
  const { messages, sendMessage, status, error, clearError } = useChat({
    id: conversation?.id ?? placeholder,
    messages: initialMessages,
    transport,
    onFinish: async () => {
      if (convId.current) onSaved?.(convId.current);
      if (getBalance) {
        const next = await getBalance(orgId);
        if (next?.remaining !== undefined) setRemaining((r) => ({ ...r, [orgId]: next.remaining as number }));
      }
    },
  });
  const busy = status === "submitted" || status === "streaming";
  const chatting = messages.length > 0;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  useEffect(() => {
    const el = thread.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  function ask(value: string) {
    const t = value.trim();
    if (!t || busy) return;
    setText("");
    clearError();
    void sendMessage({ text: t }, { body: { orgId, product, page: context?.data } });
  }

  const failure = error ? readFailure(error.message) : null;
  const current = orgs.find((o) => o.id === orgId);

  return (
    <div className={`pc${chatting ? " chatting" : ""}`}>
      <div className="pc-top">
        <button type="button" className="pc-new" onClick={onNew}>
          + New chat
        </button>
      </div>

      {chatting ? (
        <div className="pc-thread" ref={thread} aria-live="polite">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="pc-msg me">
                {textOf(m)}
              </div>
            ) : (
              <div key={m.id} className="pc-msg pair">
                <div className="pc-who">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" />
                  Pair
                </div>
                {m.parts.map((p, i) =>
                  p.type === "text" ? (
                    p.text ? (
                      <div key={i} className="pc-txt">
                        {p.text}
                      </div>
                    ) : null
                  ) : p.type.startsWith("tool-") && p.type !== "tool-find_tools" ? (
                    <div key={i} className="pc-used">
                      Used {p.type.slice(5).replace(/_/g, " ")}
                    </div>
                  ) : null,
                )}
                {!busy && m === messages[messages.length - 1] && lastUser && (
                  <div className="pc-meta">
                    <button type="button" onClick={() => ask(textOf(lastUser))}>
                      Retry
                    </button>
                  </div>
                )}
              </div>
            ),
          )}
          {status === "submitted" && (
            <div className="pc-typing" role="status" aria-label="Pair is thinking">
              <i />
              <i />
              <i />
            </div>
          )}
          {failure && (
            <div className={`pc-msg pair${OUT_OF_CREDITS.has(failure.code) ? " warn" : ""}`}>
              <div className="pc-who">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={icon} alt="" />
                Pair
              </div>
              <div className="pc-card" role="alert">
                <div className="rt">
                  <b>{OUT_OF_CREDITS.has(failure.code) ? "Pair is out of credits" : "Pair could not answer"}</b>
                </div>
                <p>{failure.message}</p>
                <div className="pc-acts">
                  {OUT_OF_CREDITS.has(failure.code) && topUpHref && (
                    <a className="go" href={topUpHref}>
                      Top up credits
                    </a>
                  )}
                  <button type="button" onClick={() => clearError()}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pc-hello">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} alt="" />
          <Greeting name={name} />
          <p>How can I help today?</p>
          <div className="pc-modes" role="tablist">
            {modes.map((m) => (
              <button key={m.id} type="button" role="tab" aria-selected={mode.id === m.id} className={mode.id === m.id ? "on" : ""} onClick={() => setModeId(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {!chatting && (
          <div className="pc-sugs">
          {mode.suggestions.map((s) => (
            <button key={s} type="button" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="pc-composer"
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
      >
        {context && (
          <span className="pc-ctx">
            <DocIcon size={14} />
            <span>{context.label}</span>
          </span>
        )}
        <textarea
          ref={box}
          rows={1}
          value={text}
          aria-label="Message"
          placeholder={mode.placeholder}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              ask(text);
            }
          }}
        />
        <div className="pc-foot">
          {orgs.length > 1 && (
            <select aria-label="Organisation" className="pc-orgsel" value={orgId} disabled={locked || chatting} onChange={(e) => setOrgId(e.target.value)}>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          <button type="submit" className="pc-send" aria-label="Send" disabled={busy || !text.trim()}>
            ↑
          </button>
        </div>
      </form>
      <small className="pc-note" title={current?.source === "organisation" ? "Paid by the organisation" : "Paid from your own Pair credits"}>
        <b>{remaining[orgId]?.toLocaleString() ?? "-"}</b> Pair credits left · Pair can make mistakes. Always double-check the results.
      </small>
    </div>
  );
}

function textOf(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

// The route answers with { error, code }; the chat library hands us the body as the message.
function readFailure(message: string): { message: string; code: string } {
  try {
    const parsed = JSON.parse(message) as { error?: string; code?: string };
    return { message: parsed.error ?? "Something went wrong.", code: parsed.code ?? "OTHER" };
  } catch {
    return { message: message || "Something went wrong.", code: "OTHER" };
  }
}
