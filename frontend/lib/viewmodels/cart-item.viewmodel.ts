import type { StoreMenuViewModel } from "./store-detail.viewmodel";
import type { CartItem } from "@/contexts/app-context";

/**
 * Creates a cart item payload from a menu item view model.
 * This prepares the item to be added to the global cart state via context.
 * 
 * @param menu - The StoreMenuViewModel of the item to add.
 * @returns An object conforming to the structure needed by the `addToCart` function.
 */
export function createCartItem(menu: StoreMenuViewModel): Omit<CartItem, 'quantity'> {
  return {
    menuId: menu.id,
    name: menu.name,
    price: menu.discountPrice,
    originalPrice: menu.originalPrice,
    thumbnail: menu.thumbnail,
  };
}
