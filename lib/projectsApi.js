import { supabase } from "./supabase";

export async function listProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createProject(name = "Nový projekt") {
  const defaultSettings = {
    allowEmoji: true,
    allowGifs: true,
    allowAttachments: true,
    storeMeta: false,
    showDPA: true,
    showConsent: true,
    dpaText: "Souhlasím se zpracováním osobních údajů.",
    consentText: "Souhlasím s účastí na výzkumu."
  };
  const { data, error } = await supabase
    .from("projects")
    .insert([{ name, settings: defaultSettings }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameProject(id, newName) {
  const { data, error } = await supabase
    .from("projects")
    .update({ name: newName })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteProject(id) {
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return true;
}
