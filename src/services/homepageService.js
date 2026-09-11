import { homepageData } from "../lib/supabaseData";

export async function getHomepageSections() { return homepageData.getAll(); }
export async function updateSection(key, data) { return homepageData.update(key, data); }
