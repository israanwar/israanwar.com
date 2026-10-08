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
