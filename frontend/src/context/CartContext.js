import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (menuItemId, quantity = 1) => {
    if (!token) {
      toast.error('Please login to add items to cart');
      return;
    }
    try {
      await axios.post(
        `${API}/cart/add`,
        { menu_item_id: menuItemId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
      toast.success('Item added to cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (!token) return;
    try {
      await axios.put(
        `${API}/cart/update/${cartItemId}?quantity=${quantity}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
    } catch (error) {
      console.error('Failed to update cart:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!token) return;
    try {
      await axios.delete(`${API}/cart/remove/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      await axios.delete(`${API}/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems([]);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.menu_item.special_offer
        ? item.menu_item.price * (1 - item.menu_item.special_offer / 100)
        : item.menu_item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
    fetchCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
