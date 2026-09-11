import { settingsData } from "../lib/supabaseData";

export async function getSiteSettings() { return settingsData.get(); }
export async function updateSiteSettings(patch) { return settingsData.update(patch); }
