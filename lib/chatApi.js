// lib/chatApi.js
import { supabase } from "./supabaseClient";

/** ===== PROJECT ID PERSIST ===== */
export function getProjectIdFromAnywhere() {
  // 1) ?project=...  2) localStorage:projectId
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("project");
    if (q) {
      localStorage.setItem("projectId", q);
      return q;
    }
    const saved = localStorage.getItem("projectId");
    if (saved) return saved;
  }
  return null;
}
export function setProjectIdLocal(projectId) {
  if (typeof window !== "undefined") {
    localStorage.setItem("projectId", projectId);
  }
}

/** ===== PROJECT ===== */
export async function getProjectById(id) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data;
}

/** ===== CHAT WINDOWS (podokna) ===== */
export async function listChatWindows(projectId) {
  const { data, error } = await supabase
    .from("chat_windows")
    .select("id, title, meeting_at, links_disabled, created_at")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createChatWindow(projectId, title = "Nové podokno") {
  const { data, error } = await supabase
    .from("chat_windows")
    .insert([{ project_id: projectId, title }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameChatWindow(chatId, newTitle) {
  const { data, error } = await supabase
    .from("chat_windows")
    .update({ title: newTitle })
    .eq("id", chatId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setChatDate(chatId, iso) {
  const { data, error } = await supabase
    .from("chat_windows")
    .update({ meeting_at: iso })
    .eq("id", chatId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setLinksDisabled(chatId, disabled) {
  const { data, error } = await supabase
    .from("chat_windows")
    .update({ links_disabled: !!disabled })
    .eq("id", chatId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getChatWindowById(id) {
  const { data, error } = await supabase
    .from("chat_windows")
    .select("id, project_id, title, meeting_at, links_disabled")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data;
}

/** ===== LINKY ===== */
function makeBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://research-chat-mu.vercel.app";
}
function rndToken() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}
export function buildJoinUrl(type, chatId, token) {
  const base = makeBaseUrl();
  return `${base}/join?type=${encodeURIComponent(type)}&chat=${encodeURIComponent(
    chatId
  )}&l=${encodeURIComponent(token)}`;
}

export async function listLinks(chatId) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("id, chat_id, role, internal_name, url, nickname, multi, created_at")
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createRespondentLink(chatId, internalName) {
  const token = rndToken();
  const url = buildJoinUrl("respondent", chatId, token);
  const { data, error } = await supabase
    .from("chat_links")
    .insert([
      {
        chat_id: chatId,
        role: "respondent",
        internal_name: internalName || "",
        url,
        token,
        nickname: "",
        multi: false,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createClientLink(chatId, label = "Klient (multi)") {
  const token = rndToken();
  const url = buildJoinUrl("client", chatId, token);
  const { data, error } = await supabase
    .from("chat_links")
    .insert([
      {
        chat_id: chatId,
        role: "client",
        internal_name: label || "Klient (multi)",
        url,
        token,
        nickname: "",
        multi: true,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLink(linkId) {
  const { error } = await supabase
    .from("chat_links")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", linkId);
  if (error) throw error;
  return true;
}

export async function getLinkByToken(token) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("*")
    .eq("token", token)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data;
}

export async function setNicknameOnLink(linkId, nickname) {
  const { data, error } = await supabase
    .from("chat_links")
    .update({ nickname })
    .eq("id", linkId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** ===== CHAT ZPRÁVY ===== */
export async function listMessages(chatId, limit = 200) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, chat_id, sender_role, sender_name, content, recipient_link_id, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function sendMessage({ chatId, senderRole, senderName, content, recipientLinkId = null }) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([
      {
        chat_id: chatId,
        sender_role: senderRole,
        sender_name: senderName || "",
        content,
        recipient_link_id: recipientLinkId || null,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeMessages(chatId, onNew) {
  const channel = supabase
    .channel(`chat_messages_${chatId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_id=eq.${chatId}` },
      (payload) => onNew && onNew(payload.new)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
