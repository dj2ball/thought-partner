import { create } from "zustand";
import { nanoid } from "nanoid";
import type { ChatMessage } from "./types";

type State = {
  messages: ChatMessage[];
  addMessage: (m: Omit<ChatMessage, "id" | "createdAt">) => string;
  addUserMessage: (m: Omit<ChatMessage, "id" | "createdAt" | "role">) => string;
  patchMessage: (id: string, patch: Partial<ChatMessage>) => void;
};

export const useChat = create<State>((set) => ({
  messages: [],
  addMessage: (m) => {
    const id = nanoid();
    const msg: ChatMessage = { id, createdAt: new Date().toISOString(), ...m };
    set((s) => ({ messages: [...s.messages, msg] }));
    return id;
  },
  addUserMessage: (m) => {
    const id = nanoid();
    const msg: ChatMessage = { id, role: "user", createdAt: new Date().toISOString(), ...m };
    set((s) => ({ messages: [...s.messages, msg] }));
    return id;
  },
  patchMessage: (id, patch) => set((s) => ({ messages: s.messages.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
}));