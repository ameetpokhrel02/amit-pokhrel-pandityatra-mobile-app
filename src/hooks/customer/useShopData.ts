import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/store/auth.store";
import { getSamagriItems, getSamagriCategories, getWishlist, toggleWishlist } from "@/services/samagri.service";
import { fetchBanners, Banner } from "@/services/banner.service";
import { SamagriItem } from "@/services/api";

export type ShopSort = "featured" | "price_asc" | "price_desc" | "newest";

export const SORT_OPTIONS: { key: ShopSort; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "newest", label: "Newest" },
];

/** Shape returned by GET samagri/items/ (see API.md) */
export interface ShopItem extends SamagriItem {
  category_name?: string;
  unit?: string;
  created_at?: string;
  vendor_details?: { id: number; shop_name: string };
}

const toList = (data: any) => (Array.isArray(data) ? data : data?.results || []);

const wishlistIds = (data: any): number[] =>
  toList(data)
    .map((w: any) => w.item?.id || w.samagri_item?.id || w.item_id || w.id)
    .filter(Boolean);

export const useShopData = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ShopItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sort, setSort] = useState<ShopSort>("featured");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([getSamagriItems(), getSamagriCategories()]);
      setProducts(toList(itemsRes));
      setCategories(toList(categoriesRes));
      setError(null);
    } catch (err) {
      console.error("[Shop] Catalog load failed", err);
      setError("We couldn't load the shop right now.");
    }

    // Non-critical extras: the shop still works without them
    fetchBanners()
      .then((data) => setBanners(toList(data)))
      .catch(() => setBanners([]));

    if (isAuthenticated) {
      getWishlist()
        .then((data) => setWishlist(wishlistIds(data)))
        .catch((err) => console.warn("[Shop] Wishlist load failed", err));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await loadData();
      if (active) setLoading(false);
    };
    run();
    return () => {
      active = false;
    };
  }, [loadData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleToggleWishlist = async (itemId: number) => {
    if (!isAuthenticated) {
      router.push("/(public)/role-selection");
      return;
    }
    // Optimistic: flip immediately, reconcile with the server afterwards
    const previous = wishlist;
    setWishlist((ids) => (ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId]));
    try {
      await toggleWishlist(itemId);
    } catch (err) {
      console.warn("[Shop] Wishlist toggle failed", err);
      setWishlist(previous);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = products.filter((product) => {
      const categoryId = typeof product.category === "object" ? product.category?.id : product.category;
      if (selectedCategory !== null && categoryId !== selectedCategory) return false;
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query) ||
        (product.category_name || "").toLowerCase().includes(query)
      );
    });

    switch (sort) {
      case "price_asc":
        return [...list].sort((a, b) => Number(a.price) - Number(b.price));
      case "price_desc":
        return [...list].sort((a, b) => Number(b.price) - Number(a.price));
      case "newest":
        return [...list].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      default:
        // In-stock items first, otherwise keep the server order
        return [...list].sort((a, b) => Number(b.stock_quantity !== 0) - Number(a.stock_quantity !== 0));
    }
  }, [products, selectedCategory, searchQuery, sort]);

  return {
    loading,
    refreshing,
    error,
    refresh,
    retry: () => {
      setLoading(true);
      loadData().finally(() => setLoading(false));
    },
    products,
    categories,
    banners,
    selectedCategory,
    setSelectedCategory,
    sort,
    setSort,
    wishlist,
    searchQuery,
    setSearchQuery,
    handleToggleWishlist,
    filteredProducts,
  };
};
