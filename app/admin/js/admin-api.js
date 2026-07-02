import { getSupabase } from "../../js/supabase-client.js";

export async function fetchIsAdmin(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listPending() {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("admin_list_pending");
  if (error) throw error;
  return data || { reports: [], submissions: [] };
}

export async function approveReport(id) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_approve_report", { p_report_id: id });
  if (error) throw error;
}

export async function rejectReport(id) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_reject_report", { p_report_id: id });
  if (error) throw error;
}

export async function approveSubmission(id) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_approve_submission", { p_submission_id: id });
  if (error) throw error;
}

export async function rejectSubmission(id) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("admin_reject_submission", { p_submission_id: id });
  if (error) throw error;
}
