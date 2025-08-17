// lib/chatApi.js
import { supabase } from "./supabase";

// ========== Pomocné ==========
function makeBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  // fallback při buildu na Vercelu – uprav, pokud máš jinou doménu
  return "https://research-chat-mu.vercel.app";
}
function rndToken() {
  // delší, unikátnější token
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}
export function buildJoinUrl(type, chatId, token) {
  const base = makeBaseUrl();
  // stránka /join umí načíst typ, chat a token z query stringu
  return `${base}/join?type=${encodeURIComponent(type)}&chat=${encodeURIComponent(chatId)}&l=${encodeURIComponent(token)}`;
}

// ========== Projekty & chaty ==========
export async function getProjectById(projectId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
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

// ========== Linky ==========
export async function listLinks(chatId) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("id, chat_id, role, internal_name, url, token, nickname, multi, created_at, deleted_at")
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
