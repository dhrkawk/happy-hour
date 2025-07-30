'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react"

// --- Data Structures ---

// Represents a single item in the shopping cart
export interface CartItem {
  menuId: string;
  name: string;
  price: number; // The final price after discount
  originalPrice: number; // Price before discount
  quantity: number;
  thumbnail: string;
}

// Holds all items for a single store's cart
export interface Cart {
  storeId: string;
  storeName: string;
  items: CartItem[];
}

interface LocationState {
  coordinates: { lat: number; lng: number } | null
  address: string | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface AppState {
  location: LocationState
  cart: Cart | null; // Cart can be null when empty
}

// --- Context Definition ---

interface AppContextType {
  appState: AppState
  fetchLocation: () => void
  
  // Cart Management Functions
  addToCart: (store: { id: string; name: string }, item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (menuId: string) => void;
  updateItemQuantity: (menuId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotals: () => { totalItems: number; totalPrice: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// --- Provider Component ---

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [appState, setAppState] = useState<AppState>({
    location: {
      coordinates: null,
      address: null,
      loading: false,
      error: null,
      lastUpdated: null,
    },
    cart: null, // Initialize cart as null
  });

  // --- Location Logic ---

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setAppState((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          error: "이 브라우저에서는 위치 정보를 지원하지 않습니다.",
          coordinates: { lat: 37.5559902611037, lng: 127.04385216428395 },
          address: "한양대 부근",
        }
      }))
      return
    }

    setAppState((prev) => ({ ...prev, location: { ...prev.location, loading: true, error: null } }))

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.address
          const locationString = `${address.city || ""} ${address.road || address.suburb || address.neighbourhood || ""}`.trim()

          setAppState((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat: latitude, lng: longitude },
              address: locationString || "위치를 찾을 수 없습니다.",
              loading: false,
              lastUpdated: new Date(),
            }
          }))
        } catch (err) {
          setAppState((prev) => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: { lat: latitude, lng: longitude },
              address: "주소를 가져오는 데 실패했습니다.",
              loading: false,
              lastUpdated: new Date(),
            }
          }))
        }
      },
      (err) => {
        let errorMessage = "현재 위치를 가져올 수 없습니다."
        if (err.code === err.PERMISSION_DENIED) {
          errorMessage = "위치 정보 제공에 동의가 필요합니다."
        }

        setAppState((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            error: errorMessage,
            coordinates: { lat: 37.5559902611037, lng: 127.04385216428395 },
            address: "한양대 부근",
            loading: false,
          }
        }))
      }
    )
  }, [])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  // --- Cart Logic ---

  const addToCart = useCallback((store: { id: string; name: string }, item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setAppState(prev => {
      const currentCart = prev.cart;
      const quantityToAdd = item.quantity ?? 1;

      // If cart is empty or for a different store, create a new cart
      if (!currentCart || currentCart.storeId !== store.id) {
        return {
          ...prev,
          cart: {
            storeId: store.id,
            storeName: store.name,
            items: [{ ...item, quantity: quantityToAdd }],
          }
        };
      }

      // If cart is for the same store, update it
      const existingItemIndex = currentCart.items.findIndex(i => i.menuId === item.menuId);
      let newItems: CartItem[];

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        newItems = currentCart.items.map((i, index) => 
          index === existingItemIndex ? { ...i, quantity: i.quantity + quantityToAdd } : i
        );
      } else {
        // Add new item if it doesn't exist
        newItems = [...currentCart.items, { ...item, quantity: quantityToAdd }];
      }

      return {
        ...prev,
        cart: { ...currentCart, items: newItems }
      };
    });
  }, []);

  const removeFromCart = useCallback((menuId: string) => {
    setAppState(prev => {
      if (!prev.cart) return prev;

      const newItems = prev.cart.items.filter(i => i.menuId !== menuId);

      // If last item is removed, clear the whole cart
      if (newItems.length === 0) {
        return { ...prev, cart: null };
      }

      return { ...prev, cart: { ...prev.cart, items: newItems } };
    });
  }, []);

  const updateItemQuantity = useCallback((menuId: string, quantity: number) => {
    setAppState(prev => {
      if (!prev.cart) return prev;

      if (quantity <= 0) {
        // If quantity is zero or less, remove the item
        const newItems = prev.cart.items.filter(i => i.menuId !== menuId);
        if (newItems.length === 0) {
          return { ...prev, cart: null };
        }
        return { ...prev, cart: { ...prev.cart, items: newItems } };
      } else {
        // Otherwise, update the quantity
        const newItems = prev.cart.items.map(i => 
          i.menuId === menuId ? { ...i, quantity } : i
        );
        return { ...prev, cart: { ...prev.cart, items: newItems } };
      }
    });
  }, []);

  const clearCart = useCallback(() => {
    setAppState(prev => ({ ...prev, cart: null }));
  }, []);

  const getCartTotals = useCallback(() => {
    const cart = appState.cart;
    if (!cart) return { totalItems: 0, totalPrice: 0 };

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return { totalItems, totalPrice };
  }, [appState.cart]);


  // --- Context Provider Value ---

  return (
    <AppContext.Provider value={{ 
      appState, 
      fetchLocation,
      addToCart,
      removeFromCart,
      updateItemQuantity,
      clearCart,
      getCartTotals,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// --- Custom Hook ---

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error("useAppContext must be used within an AppProvider")
  return context
}