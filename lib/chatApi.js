// lib/chatApi.js
import { supabase } from "./supabaseClient";

/** ========== POMOCNÉ ========== */
function makeBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://research-chat-mu.vercel.app"; // fallback pro build
}
function rndToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

/** ========== PROJECTS / CHAT WINDOWS (co už máš) ========== */
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

export async function getChatWindowById(id) {
  const { data, error } = await supabase
    .from("chat_windows")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data;
}

export async function listChatWindows(projectId) {
  const { data, error } = await supabase
    .from("chat_windows")
    .select("*")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createChatWindow(projectId, name) {
  const { data, error } = await supabase
    .from("chat_windows")
    .insert([{ project_id: projectId, name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameChatWindow(chatId, name) {
  const { data, error } = await supabase
    .from("chat_windows")
    .update({ name })
    .eq("id", chatId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** ========== LINKY (co už máš) ========== */
export function buildJoinUrl(type, chatId, token) {
  const base = makeBaseUrl();
  return `${base}/join?type=${encodeURIComponent(type)}&chat=${encodeURIComponent(chatId)}&l=${encodeURIComponent(token)}`;
}

export async function listLinks(chatId) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("id, chat_id, role, internal_name, url, nickname, multi, deleted_at")
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
    .insert([{ chat_id: chatId, role: "respondent", internal_name: internalName || "", url, token, nickname: "", multi: false }])
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
    .insert([{ chat_id: chatId, role: "client", internal_name: label || "Klient (multi)", url, token, nickname: "", multi: true }])
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

/** ========== RESPONDENTI (pro levý sloupec) ========== */
export async function listRespondents(chatId) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("id, internal_name, nickname")
    .eq("chat_id", chatId)
    .eq("role", "respondent")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/** ========== ZPRÁVY V CHATTU (veřejné + DM) ========== */
export async function listMessages(chatId) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, sender_role, sender_name, content, recipient_link_id, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage({ chatId, senderRole, senderName, content, recipientLinkId = null }) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([{
      chat_id: chatId,
      sender_role: senderRole,
      sender_name: senderName || "",
      content,
      recipient_link_id: recipientLinkId || null
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function subscribeMessages(chatId, onNew) {
  // Supabase Realtime – posloucháme INSERTY do chat_messages
  const channel = supabase
    .channel(`chat_messages_${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` },
      (payload) => {
        if (onNew) onNew(payload.new);
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/** ========== POZNÁMKY MODERÁTORA ========== */
export async function getNote(chatId) {
  const { data, error } = await supabase
    .from("chat_notes")
    .select("content, updated_at")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error) throw error;
  return data || { content: "" };
}

export async function saveNote(chatId, content) {
  const { data, error } = await supabase
    .from("chat_notes")
    .upsert({ chat_id: chatId, content, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}
