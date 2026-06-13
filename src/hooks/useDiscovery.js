import { useState, useEffect, useCallback, useRef } from "react";
import { ref, onValue, get } from "firebase/database";
import { realtimeDB } from "../firebaseConfig";

const BATCH_SIZE = 20;
const DISH_BATCH_SIZE = 20;

export default function useDiscovery() {
  const [restaurants, setRestaurants] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("likes");
  const [hasMore, setHasMore] = useState(true);
  const [dishHasMore, setDishHasMore] = useState(true);
  const [searchMode, setSearchMode] = useState("auto"); // "auto" | "restaurants" | "dishes"

  const allRestaurantsRef = useRef([]);
  const allDishesRef = useRef([]);
  const unsubscribeRef = useRef(null);

  // ========== EFFECTIVE SEARCH MODE ==========
  const effectiveSearchMode = useCallback(() => {
    if (searchMode !== "auto") return searchMode;
    // Auto-detect: if query matches a dish name across restaurants, show dishes
    if (!searchQuery.trim()) return "restaurants";
    const q = searchQuery.toLowerCase().trim();
    const dishMatchCount = allDishesRef.current.filter((d) =>
      d.name?.toLowerCase().includes(q)
    ).length;
    const restaurantMatchCount = allRestaurantsRef.current.filter((r) =>
      r.name?.toLowerCase().includes(q) ||
      r.cuisine?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q)
    ).length;
    // If more dishes match than restaurants, or dishes match strongly
    if (dishMatchCount > 0 && dishMatchCount >= restaurantMatchCount) return "dishes";
    return "restaurants";
  }, [searchMode, searchQuery]);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const restaurantsRef = ref(realtimeDB, "restaurants");
      const snapshot = await get(restaurantsRef);

      if (!snapshot.exists()) {
        setRestaurants([]);
        setDishes([]);
        setLoading(false);
        setHasMore(false);
        setDishHasMore(false);
        return;
      }

      const data = snapshot.val();
      const restaurantList = [];
      const dishList = [];
      const citySet = new Set();
      const categorySet = new Set();

      for (const [restaurantId, restaurantData] of Object.entries(data)) {
        const restaurant = {
          id: restaurantId,
          ...restaurantData,
          slug: restaurantData.slug || restaurantId,
          name: restaurantData.restaurantName || restaurantData.name || "Unnamed Restaurant",
          logo: restaurantData.logo || "",
          coverImage: restaurantData.coverImage || restaurantData.image || "",
          city: restaurantData.city || restaurantData.contact?.city || "",
          address: restaurantData.address || restaurantData.contact?.address || "",
          cuisine: restaurantData.cuisine || restaurantData.category || "",
          rating: restaurantData.rating || restaurantData.avgRating || 0,
          isOpen: restaurantData.isOpen !== false,
          contact: restaurantData.contact || {},
          whatsappNumber: restaurantData.whatsappNumber || restaurantData.contact?.phone || "",
          minOrder: restaurantData.minOrder || 0,
          deliveryTime: restaurantData.deliveryTime || "",
          priceForTwo: restaurantData.priceForTwo || "",
          totalLikes: 0,
          topDishes: [],
          allDishNames: [],
          dishCount: 0,
          totalOrders: 0,
          createdAt: restaurantData.createdAt || 0,
        };

        if (restaurant.city) citySet.add(restaurant.city);
        if (restaurant.cuisine) {
          restaurant.cuisine.split(",").forEach((c) => {
            const trimmed = c.trim().toLowerCase();
            if (trimmed) categorySet.add(trimmed);
          });
        }

        restaurantList.push(restaurant);
      }

      // Fetch menu data (likes + ALL dish names) + build dish list
      const restaurantsWithMenu = await Promise.all(
        restaurantList.map(async (restaurant) => {
          try {
            const menuRef = ref(realtimeDB, `restaurants/${restaurant.id}/menu`);
            const menuSnap = await get(menuRef);
            if (menuSnap.exists()) {
              const menuData = menuSnap.val();
              let totalLikes = 0;
              let allDishes = [];
              let dishCount = 0;

              for (const [dishId, dishData] of Object.entries(menuData)) {
                dishCount++;
                const likes = dishData?.likes ? Object.keys(dishData.likes).length : 0;
                totalLikes += likes;

                const dishObj = {
                  id: dishId,
                  name: dishData.name || "",
                  price: dishData.price || 0,
                  likes,
                  image: dishData.imageUrl || dishData.image || "",
                  description: dishData.description || "",
                  category: dishData.category || "",
                  vegType: dishData.vegType || "",
                  prepTime: dishData.prepTime || "",
                  spiceLevel: dishData.spiceLevel || "",
                  isNew: dishData.isNew || false,
                  // Restaurant info attached to each dish
                  restaurantId: restaurant.id,
                  restaurantSlug: restaurant.slug,
                  restaurantName: restaurant.name,
                  restaurantLogo: restaurant.logo,
                  restaurantCity: restaurant.city,
                  restaurantIsOpen: restaurant.isOpen,
                  restaurantRating: restaurant.rating,
                  restaurantTotalLikes: totalLikes,
                };

                allDishes.push(dishObj);
                dishList.push(dishObj);
              }

              // Sort by likes for topDishes display
              const sorted = [...allDishes].sort((a, b) => b.likes - a.likes);
              const topDishes = sorted.slice(0, 3).map((d) => ({
                id: d.id,
                name: d.name,
                price: d.price,
                likes: d.likes,
                image: d.image,
                description: d.description,
                category: d.category,
              }));

              const allDishNames = allDishes.map((d) => d.name.toLowerCase());

              return { ...restaurant, totalLikes, topDishes, allDishNames, dishCount };
            }
            return restaurant;
          } catch {
            return restaurant;
          }
        })
      );

      // Fetch order counts
      const restaurantsWithOrders = await Promise.all(
        restaurantsWithMenu.map(async (restaurant) => {
          try {
            const ordersRef = ref(realtimeDB, `orders/${restaurant.id}`);
            const ordersSnap = await get(ordersRef);
            if (ordersSnap.exists()) {
              return { ...restaurant, totalOrders: Object.keys(ordersSnap.val()).length };
            }
            return restaurant;
          } catch {
            return restaurant;
          }
        })
      );

      allRestaurantsRef.current = restaurantsWithOrders;
      allDishesRef.current = dishList;

      setCities(Array.from(citySet).sort());
      setCategories(
        Array.from(categorySet).map((cat) => ({
          id: cat,
          name: cat.charAt(0).toUpperCase() + cat.slice(1),
        }))
      );

      applyFiltersAndSort(restaurantsWithOrders, "", "", "", "likes");
      applyDishFilters(dishList, "", "");
      setLoading(false);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("Failed to load restaurants. Please try again.");
      setLoading(false);
    }
  }, []);

  // ========== RESTAURANT FILTER + SORT ==========
  const applyFiltersAndSort = useCallback((data, query, city, category, sort) => {
    let filtered = [...data];

    if (query.trim()) {
      const searchLower = query.toLowerCase().trim();
      filtered = filtered.filter((r) => {
        const nameMatch = r.name?.toLowerCase().includes(searchLower);
        const cuisineMatch = r.cuisine?.toLowerCase().includes(searchLower);
        const cityMatch = r.city?.toLowerCase().includes(searchLower);
        const dishMatch = r.allDishNames?.some((name) => name.includes(searchLower));
        const descMatch = r.topDishes?.some((d) =>
          d.description?.toLowerCase().includes(searchLower)
        );
        return nameMatch || cuisineMatch || cityMatch || dishMatch || descMatch;
      });

      filtered.sort((a, b) => {
        const searchLower2 = query.toLowerCase().trim();
        const aDishMatch = a.allDishNames?.some((n) => n.includes(searchLower2));
        const bDishMatch = b.allDishNames?.some((n) => n.includes(searchLower2));
        if (aDishMatch && bDishMatch) return (b.totalLikes || 0) - (a.totalLikes || 0);
        if (aDishMatch && !bDishMatch) return -1;
        if (!aDishMatch && bDishMatch) return 1;
        return (b.totalLikes || 0) - (a.totalLikes || 0);
      });
    }

    if (city) {
      filtered = filtered.filter((r) => r.city?.toLowerCase() === city.toLowerCase());
    }

    if (category) {
      filtered = filtered.filter((r) =>
        r.cuisine?.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (!query.trim()) {
      switch (sort) {
        case "likes":
          filtered.sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0));
          break;
        case "orders":
          filtered.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
          break;
        case "rating":
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "newest":
          filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          break;
        default:
          break;
      }
    }

    const paginated = filtered.slice(0, BATCH_SIZE);
    setRestaurants(paginated);
    setHasMore(filtered.length > BATCH_SIZE);
  }, []);

  // ========== DISH FILTER ==========
  const applyDishFilters = useCallback((data, query, city) => {
    let filtered = [...data];

    if (query.trim()) {
      const searchLower = query.toLowerCase().trim();
      filtered = filtered.filter((d) =>
        d.name?.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower) ||
        d.category?.toLowerCase().includes(searchLower)
      );
      // Sort by likes
      filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    if (city) {
      filtered = filtered.filter((d) =>
        d.restaurantCity?.toLowerCase() === city.toLowerCase()
      );
    }

    const paginated = filtered.slice(0, DISH_BATCH_SIZE);
    setDishes(paginated);
    setDishHasMore(filtered.length > DISH_BATCH_SIZE);
  }, []);

  const filterAll = useCallback(
    (data, query, city, category) => {
      let filtered = [...data];

      if (query.trim()) {
        const searchLower = query.toLowerCase().trim();
        filtered = filtered.filter((r) => {
          const nameMatch = r.name?.toLowerCase().includes(searchLower);
          const cuisineMatch = r.cuisine?.toLowerCase().includes(searchLower);
          const cityMatch = r.city?.toLowerCase().includes(searchLower);
          const dishMatch = r.allDishNames?.some((name) => name.includes(searchLower));
          const descMatch = r.topDishes?.some((d) =>
            d.description?.toLowerCase().includes(searchLower)
          );
          return nameMatch || cuisineMatch || cityMatch || dishMatch || descMatch;
        });
        filtered.sort((a, b) => {
          const aDishMatch = a.allDishNames?.some((n) => n.includes(query.toLowerCase().trim()));
          const bDishMatch = b.allDishNames?.some((n) => n.includes(query.toLowerCase().trim()));
          if (aDishMatch && bDishMatch) return (b.totalLikes || 0) - (a.totalLikes || 0);
          if (aDishMatch && !bDishMatch) return -1;
          if (!aDishMatch && bDishMatch) return 1;
          return (b.totalLikes || 0) - (a.totalLikes || 0);
        });
      }

      if (city) filtered = filtered.filter((r) => r.city?.toLowerCase() === city.toLowerCase());
      if (category)
        filtered = filtered.filter((r) =>
          r.cuisine?.toLowerCase().includes(category.toLowerCase())
        );

      if (!query.trim()) {
        switch (sortBy) {
          case "likes": filtered.sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0)); break;
          case "orders": filtered.sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0)); break;
          case "rating": filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
          case "newest": filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); break;
          default: break;
        }
      }

      return filtered;
    },
    [sortBy]
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const filtered = filterAll(allRestaurantsRef.current, searchQuery, selectedCity, selectedCategory);
    const currentLen = restaurants.length;
    const nextBatch = filtered.slice(currentLen, currentLen + BATCH_SIZE);
    if (nextBatch.length === 0) { setHasMore(false); return; }
    setRestaurants((prev) => [...prev, ...nextBatch]);
    setHasMore(filtered.length > currentLen + nextBatch.length);
  }, [restaurants, hasMore, loading, searchQuery, selectedCity, selectedCategory, filterAll]);

  // ========== DISH LOAD MORE ==========
  const loadMoreDishes = useCallback(() => {
    if (!dishHasMore || loading) return;
    let filtered = [...allDishesRef.current];

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((d) =>
        d.name?.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower) ||
        d.category?.toLowerCase().includes(searchLower)
      );
      filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    if (selectedCity) {
      filtered = filtered.filter((d) =>
        d.restaurantCity?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    const currentLen = dishes.length;
    const nextBatch = filtered.slice(currentLen, currentLen + DISH_BATCH_SIZE);
    if (nextBatch.length === 0) { setDishHasMore(false); return; }
    setDishes((prev) => [...prev, ...nextBatch]);
    setDishHasMore(filtered.length > currentLen + nextBatch.length);
  }, [dishes, dishHasMore, loading, searchQuery, selectedCity]);

  useEffect(() => {
    fetchRestaurants();
    const likesRef = ref(realtimeDB, "restaurants");
    const unsub = onValue(likesRef, () => {
      const timeout = setTimeout(() => fetchRestaurants(), 2000);
      return () => clearTimeout(timeout);
    });
    unsubscribeRef.current = unsub;
    return () => { if (unsubscribeRef.current) unsubscribeRef.current(); };
  }, [fetchRestaurants]);

  useEffect(() => {
    if (allRestaurantsRef.current.length > 0) {
      applyFiltersAndSort(
        allRestaurantsRef.current,
        searchQuery,
        selectedCity,
        selectedCategory,
        sortBy
      );
    }
  }, [searchQuery, selectedCity, selectedCategory, sortBy, applyFiltersAndSort]);

  // Re-filter dishes when search/city changes
  useEffect(() => {
    if (allDishesRef.current.length > 0) {
      applyDishFilters(allDishesRef.current, searchQuery, selectedCity);
    }
  }, [searchQuery, selectedCity, applyDishFilters]);

  return {
    restaurants,
    dishes,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCity,
    setSelectedCity,
    selectedCategory,
    setSelectedCategory,
    cities,
    categories,
    sortBy,
    setSortBy,
    hasMore,
    loadMore,
    dishHasMore,
    loadMoreDishes,
    searchMode,
    setSearchMode,
    effectiveSearchMode: effectiveSearchMode(),
  };
}