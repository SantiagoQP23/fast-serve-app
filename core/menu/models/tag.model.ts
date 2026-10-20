export interface Tag {
  id: string;
  name: string;
  isActive: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A tag as the tags screen lists it, with the products it is on. */
export interface TagWithProducts extends Tag {
  productIds: string[];
}

/** Tags the waiter can pick for a product, A-Z. */
export function getSelectableTags(tags: Tag[] | undefined): Tag[] {
  return (tags ?? [])
    .filter((tag) => tag.isActive && !tag.isArchived)
    .sort((a, b) => a.name.localeCompare(b.name));
}
