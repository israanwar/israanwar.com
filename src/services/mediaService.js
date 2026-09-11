import { mediaData } from "../lib/supabaseData";

export async function listMedia() { return mediaData.list(); }
export async function uploadMedia(file, uploadedBy) { return mediaData.upload(file, uploadedBy); }
export async function deleteMedia(id) { return mediaData.delete(id); }
