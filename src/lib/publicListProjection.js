// Small read-only projections for homepage cards. Full records remain the
// default for detail pages, the admin editor, and Balao's knowledge.
export const HOME_POST_SELECT = "id,slug,title,status,category,published_at,created_at,updated_at,author_id";
export const SERVICE_FOLDER_SELECT = "id,slug,name,status,kind,parent_slug,order_index,card_id:data->id,seed_source:data->seed_source,service_count:data->service_count,child_slugs:data->child_slugs,parent_name:data->parent_name";

export function serviceFolderRow(row) {
  return {
    ...row,
    data: {
      id: row.card_id ?? row.id,
      seed_source: row.seed_source,
      service_count: row.service_count,
      child_slugs: row.child_slugs,
      parent_name: row.parent_name,
    },
  };
}

// The local seed fallback must hand the homepage the same reduced shape that
// the Supabase `select()` projections above return. Otherwise a build without
// remote data embeds every full service and post body in the public HTML.
const pick = (item, keys) => Object.fromEntries(keys.filter(key => item?.[key] !== undefined).map(key => [key, item[key]]));
const SERVICE_FOLDER_KEYS = ["id", "slug", "name", "status", "kind", "parent_slug", "order", "seed_source", "service_count", "child_slugs", "parent_name"];
const HOME_POST_KEYS = ["id", "slug", "title", "status", "category", "published_at", "created_at", "updated_at", "author_id"];

export const projectServiceFolderItem = item => pick(item, SERVICE_FOLDER_KEYS);
export const projectHomePostItem = item => pick(item, HOME_POST_KEYS);
