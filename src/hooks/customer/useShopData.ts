import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/store/auth.store";
import { getSamagriItems, getSamagriCategories, getWishlist, toggleWishlist } from "@/services/samagri.service";
import { SamagriItem } from "@/services/api";

export const useShopData = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<SamagriItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, categoriesRes] = await Promise.all([
        getSamagriItems(),
        getSamagriCategories(),
      ]);

      const itemsData = Array.isArray(itemsRes) ? itemsRes : (itemsRes as any)?.results || [];
      const categoriesData = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes as any)?.results || [];

      setProducts(itemsData);
      setCategories([{ id: "All", name: "All" }, ...categoriesData]);

      if (isAuthenticated) {
        try {
          const wishlistRes = await getWishlist();
          const wishlistData = Array.isArray(wishlistRes) ? wishlistRes : (wishlistRes as any)?.results || [];
          const ids = wishlistData.map((w: any) => w.item?.id || w.samagri_item?.id || w.id).filter(Boolean);
          setWishlist(ids);
        } catch (error) {
          console.warn("Wishlist load failed", error);
        }
      }
    } catch (error) {
      console.error("Data load failed", error);
      Alert.alert("Error", "Failed to load shop items");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleToggleWishlist = async (itemId: number) => {
    if (!isAuthenticated) {
      router.push("/(public)/role-selection");
      return;
    }
    try {
      await toggleWishlist(itemId);
      const wishlistRes = await getWishlist();
      const wishlistData = Array.isArray(wishlistRes) ? wishlistRes : (wishlistRes as any)?.results || [];
      const ids = wishlistData.map((w: any) => w.item?.id || w.samagri_item?.id || w.id).filter(Boolean);
      setWishlist(ids);
    } catch (err) {
      Alert.alert("Error", "Wishlist update failed");
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" ||
      (product as any).category_name === selectedCategory ||
      (product as any).category?.name === selectedCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return {
    loading,
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    wishlist,
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    handleToggleWishlist,
    filteredProducts,
  };
};
