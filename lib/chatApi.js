// lib/chatApi.js
import { supabase } from "./supabaseClient";

/** ========= POMOCNÉ ========= */
function makeBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://research-chat-mu.vercel.app";
}
function rndToken() {
  return Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,10);
}
export function buildJoinUrl(type, chatId, token) {
  const base = makeBaseUrl();
  return `${base}/join?type=${encodeURIComponent(type)}&chat=${encodeURIComponent(chatId)}&l=${encodeURIComponent(token)}`;
}

/** ========= PROJEKTY ========= */
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

/** ========= PODOKNA (chat_windows) ========= */
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

export async function createChatWindow(projectId, title = "Nové podokno") {
  const { data, error } = await supabase
    .from("chat_windows")
    .insert([{ project_id: projectId, title }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameChatWindow(id, title) {
  const { data, error } = await supabase
    .from("chat_windows")
    .update({ title })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setChatDate(id, chat_date) {
  const { data, error } = await supabase
    .from("chat_windows")
    .update({ chat_date })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setLinksDisabled(id, links_disabled) {
  const { data, error } = await supabase
    .from("chat_windows")
    .update({ links_disabled })
    .eq("id", id)
    .select()
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

/** ========= LINKY (chat_links) ========= */
export async function listLinks(chatId) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("id, chat_id, role, internal_name, url, nickname, multi, token, deleted_at, created_at")
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createRespondentLink(chatId, internalName = "") {
  const token = rndToken();
  const url = buildJoinUrl("respondent", chatId, token);
  const { data, error } = await supabase
    .from("chat_links")
    .insert([{ chat_id: chatId, role: "respondent", internal_name: internalName, url, token, nickname: "", multi: false }])
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
    .insert([{ chat_id: chatId, role: "client", internal_name: label, url, token, nickname: "", multi: true }])
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

export async function getLinkById(id) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("*")
    .eq("id", id)
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

/** ========= SOUHLASY ========= */
export async function createConsent(linkId, nickname, agreedDpa, agreedStudy) {
  const { data, error } = await supabase
    .from("chat_consents")
    .insert([{ link_id: linkId, nickname, agreed_dpa: !!agreedDpa, agreed_study: !!agreedStudy }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** ========= ZPRÁVY ========= */
export async function sendMessage(chatId, text, authorLinkId = null, recipientLinkId = null) {
  const row = {
    chat_id: chatId,
    text,
    recipient_link_id: recipientLinkId || null, // null = veřejná
    // author_link_id: authorLinkId || null,  // až bude sloupec, můžeme zapnout
  };
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([row])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMessages(chatId, limit = 200) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data || [];
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

/** ========= ÚČASTNÍCI ========= */
export async function listParticipants(chatId) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("id, role, internal_name, nickname, deleted_at")
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/** ========= POZNÁMKY MODERÁTORA ========= */
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
