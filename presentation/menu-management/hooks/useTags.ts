import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";
import { useTranslation } from "@/core/i18n/hooks/useTranslation";
import { getErrorMessage } from "@/core/api/get-error-message";
import type { Product } from "@/core/menu/models/product.model";
import type { Tag, TagWithProducts } from "@/core/menu/models/tag.model";
import { useMenuStore } from "@/presentation/restaurant-menu/store/useMenuStore";
import { TagsService } from "../services/tags.service";

export const tagsQueryKey = ["menu-tags"];

const byName = (a: Tag, b: Tag) => a.name.localeCompare(b.name);

/**
 * Applies a tag change to the menu products on this phone right away; the
 * sync events the server sends for the same products agree with it.
 */
const updateProductsTags = (
  update: (product: Product) => Tag[] | null,
): void => {
  const { products, upsertProducts } = useMenuStore.getState();
  const changed: Product[] = [];
  for (const product of products) {
    const tags = update(product);
    if (tags) changed.push({ ...product, tags: [...tags].sort(byName) });
  }
  upsertProducts(changed);
};

const toTag = ({ productIds: _productIds, ...tag }: TagWithProducts): Tag =>
  tag;

/** Product tags ("Etiquetas"): list, create, rename, delete and link them. */
export const useTags = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { t } = useTranslation("menuManagement");

  const tagsQuery = useQuery({
    queryKey: tagsQueryKey,
    queryFn: () => TagsService.getAll(),
    enabled,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: tagsQueryKey });

  const showError = (fallback: string) => (error: Error) => {
    toast.error(getErrorMessage(error, { fallback }));
  };

  const createTag = useMutation<Tag, Error, string>({
    mutationFn: (name) => TagsService.create(name.trim()),
    onSuccess: invalidate,
    onError: showError(t("tags.createError")),
  });

  const renameTag = useMutation<Tag, Error, { id: string; name: string }>({
    mutationFn: ({ id, name }) => TagsService.rename(id, name.trim()),
    onSuccess: (tag) => {
      updateProductsTags((product) =>
        product.tags?.some((current) => current.id === tag.id)
          ? product.tags.map((current) =>
              current.id === tag.id ? { ...current, name: tag.name } : current,
            )
          : null,
      );
      invalidate();
    },
    onError: showError(t("tags.updateError")),
  });

  const deleteTag = useMutation<void, Error, string>({
    mutationFn: (id) => TagsService.remove(id),
    onSuccess: (_, id) => {
      updateProductsTags((product) =>
        product.tags?.some((tag) => tag.id === id)
          ? product.tags.filter((tag) => tag.id !== id)
          : null,
      );
      toast.success(t("tags.deleteSuccess"));
      invalidate();
    },
    onError: showError(t("tags.deleteError")),
  });

  const setTagProducts = useMutation<
    TagWithProducts,
    Error,
    { id: string; productIds: string[] }
  >({
    mutationFn: ({ id, productIds }) => TagsService.setProducts(id, productIds),
    onSuccess: (tagWithProducts) => {
      const tag = toTag(tagWithProducts);
      const linked = new Set(tagWithProducts.productIds);
      updateProductsTags((product) => {
        const has = product.tags?.some((current) => current.id === tag.id);
        if (linked.has(product.id) && !has)
          return [...(product.tags ?? []), tag];
        if (!linked.has(product.id) && has)
          return product.tags.filter((current) => current.id !== tag.id);
        return null;
      });
      invalidate();
    },
    onError: showError(t("tags.updateError")),
  });

  const setProductTags = useMutation<
    Tag[],
    Error,
    { productId: string; tagIds: string[] }
  >({
    mutationFn: ({ productId, tagIds }) =>
      TagsService.setProductTags(productId, tagIds),
    onSuccess: (tags, { productId }) => {
      updateProductsTags((product) => (product.id === productId ? tags : null));
      invalidate();
    },
    onError: showError(t("tags.updateError")),
  });

  return {
    tagsQuery,
    tags: tagsQuery.data ?? [],
    createTag,
    renameTag,
    deleteTag,
    setTagProducts,
    setProductTags,
  };
};
