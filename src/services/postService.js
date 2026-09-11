import { postsData } from "../lib/supabaseData";

export async function listPosts(filter) { return postsData.list(filter); }
export async function getPost(id) { return postsData.get(id); }
export async function getPostBySlug(slug) { return postsData.getBySlug(slug); }
export async function createPost(payload) { return postsData.create(payload); }
export async function updatePost(id, patch) { return postsData.update(id, patch); }
export async function deletePost(id) { return postsData.delete(id); }
