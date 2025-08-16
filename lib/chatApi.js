// lib/chatApi.js
import { supabase } from "./supabase";

// Pomocné funkce (jen jednou)
function rndToken() {
  // delší token pro URL
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function makeBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  // fallback pro server build (Vercel)
  return "https://research-chat-mu.vercel.app";
}

export function buildJoinUrl(type, chatId, token) {
  const base = makeBaseUrl();
  return `${base}/join?type=${encodeURIComponent(type)}&chat=${encodeURIComponent(
    chatId
  )}&l=${encodeURIComponent(token)}`;
}

// ========== Linky ==========

// Výpis linků pro daný chat
export async function listLinks(chatId) {
  const { data, error } = await supabase
    .from("chat_links")
    .select(
      "id, project_id, chat_id, role, internal_name, url, token, nickname, multi, created_at, deleted_at"
    )
    .eq("chat_id", chatId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Vytvořit link pro respondenta (single)
export async function createRespondentLink(projectId, chatId, internalName = "") {
  const token = rndToken();
  const url = buildJoinUrl("respondent", chatId, token);

  const { data, error } = await supabase
    .from("chat_links")
    .insert([
      {
        project_id: projectId,
        chat_id: chatId,
        role: "respondent",
        internal_name: internalName,
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

// Vytvořit link pro klienta (multi)
export async function createClientLink(projectId, chatId, label = "Klient (multi)") {
  const token = rndToken();
  const url = buildJoinUrl("client", chatId, token);

  const { data, error } = await supabase
    .from("chat_links")
    .insert([
      {
        project_id: projectId,
        chat_id: chatId,
        role: "client",
        internal_name: label,
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

// Soft-delete linku
export async function deleteLink(linkId) {
  const { error } = await supabase
    .from("chat_links")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", linkId);

  if (error) throw error;
  return true;
}

// Načíst link podle tokenu (při vstupu přes bránu)
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

// ========== Ostatní entity ==========

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

// Uložit přezdívku k linku (po průchodu bránou)
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

// Záznam souhlasu
export async function createConsent(linkId, nickname, agreedDpa, agreedStudy) {
  const { data, error } = await supabase
    .from("chat_consents")
    .insert([
      {
        link_id: linkId,
        nickname,
        agreed_dpa: !!agreedDpa,
        agreed_study: !!agreedStudy,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Hromadné vytvoření respondent linků (jméno na řádek)
export async function bulkCreateRespondents(projectId, chatId, raw) {
  const names = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (names.length === 0) return [];

  const rows = names.map((n) => ({
    project_id: projectId,
    chat_id: chatId,
    role: "respondent",
    internal_name: n,
    url: buildJoinUrl("respondent", chatId, rndToken()),
    token: rndToken(),
    nickname: "",
    multi: false,
  }));

  const { data, error } = await supabase
    .from("chat_links")
    .insert(rows)
    .select();

  if (error) throw error;
  return data || [];
}
