import { usersData } from "../lib/supabaseData";

export async function listProfiles() { return usersData.list(); }
export async function updateProfileRole(id, role) { return usersData.updateRole(id, role); }
