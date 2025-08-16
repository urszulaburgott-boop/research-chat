import { supabase } from "./supabase";

// ========== Pomocné funkce ==========
function rndToken() {
  // dlouhý náhodný token do URL
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function makeBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  // fallback pro server-side build (Vercel)
  return "https://research-chat-mu.vercel.app";
}

export function buildJoinUrl(type, chatId, token) {
  const base = makeBaseUrl();
  return `${base}/join?type=${encodeURIComponent(type)}&chat=${encodeURIComponent(chatId)}&l=${encodeURIComponent(token)}`;
}

// ========== Projekty / Chat okna ==========
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

export async function renameChatWindow(chatId, newName) {
  const { data, error } = await supabase
    .from("chat_windows")
    .update({ name: newName })
    .eq("id", chatId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setChatDate(chatId, startsAt, endsAt) {
  const patch = {};
  if (startsAt !== undefined) patch.starts_at = startsAt;
  if (endsAt !== undefined) patch.ends_at = endsAt;

  const { data, error } = await supabase
    .from("chat_windows")
    .update(patch)
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

// ========== Linky pro připojení ==========
export async function listLinks(chatId) {
  const { data, error } = await supabase
    .from("chat_links")
    .select("id, chat_id, role, internal_name, url, token, nickname, multi, deleted_at, created_at")
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createRespondentLink(projectId, chatId, internalName = "") {
  const token = rndToken();
  const url = buildJoinUrl("respondent", chatId, token);
  const { data, error } = await supabase
    .from("chat_links")
    .insert([{
      project_id: projectId,
      chat_id: chatId,
      role: "respondent",
      internal_name: internalName,
      url,
      token,
      nickname: "",
      multi: false
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createClientLink(projectId, chatId, label = "Klient (multi)") {
  const token = rndToken();
  const url = buildJoinUrl("client", chatId, token);
  const { data, error } = await supabase
    .from("chat_links")
    .insert([{
      project_id: projectId,
      chat_id: chatId,
      role: "client",
      internal_name: label,
      url,
      token,
      nickname: "",
      multi: true
    }])
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

// ========== Souhlasy / přezdívky ==========
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

export async function createConsent(linkId, nickname, agreedDpa, agreedStudy) {
  const { data, error } = await supabase
    .from("chat_consents")
    .insert([{ link_id: linkId, nickname, agreed_dpa: !!agreedDpa, agreed_study: !!agreedStudy }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ========== Hromadné vytvoření respondentů ==========
export async function bulkCreateRespondents(chatId, raw) {
  const names = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (names.length === 0) return [];

  const rows = names.map((n) => {
    const token = rndToken();
    const url = buildJoinUrl("respondent", chatId, token);
    return {
      chat_id: chatId,
      role: "respondent",
      internal_name: n,
      url,
      token,
      nickname: "",
      multi: false,
    };
  });

  const { data, error } = await supabase.from("chat_links").insert(rows).select();
  if (error) throw error;
  return data || [];
}
