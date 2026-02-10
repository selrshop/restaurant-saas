import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';

const CartDrawer = ({ open, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const calculateItemPrice = (item) => {
    const basePrice = item.menu_item.price;
    if (item.menu_item.special_offer) {
      return basePrice * (1 - item.menu_item.special_offer / 100);
    }
    return basePrice;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg" data-testid="cart-drawer">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <ShoppingBag className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              Please login to view your cart
            </p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4" data-testid="empty-cart">
            <ShoppingBag className="w-16 h-16 text-muted-foreground" />
            <p className="text-muted-foreground text-center">Your cart is empty</p>
            <Button
              onClick={() => {
                onClose();
                navigate('/menu');
              }}
              className="bg-primary text-white rounded-full"
              data-testid="browse-menu-button"
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-white border border-orange-100 rounded-2xl p-4 hover:shadow-md transition-shadow"
                  data-testid={`cart-item-${item.id}`}
                >
                  <img
                    src={item.menu_item.image}
                    alt={item.menu_item.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {item.menu_item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-semibold">
                        ₹{calculateItemPrice(item).toFixed(2)}
                      </span>
                      {item.menu_item.special_offer && (
                        <span className="text-xs line-through text-muted-foreground">
                          ₹{item.menu_item.price}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2 border border-orange-100 rounded-full">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                          data-testid={`decrease-quantity-${item.id}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium" data-testid={`quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          data-testid={`increase-quantity-${item.id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromCart(item.id)}
                        data-testid={`remove-item-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="border-t border-orange-100 pt-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary" data-testid="cart-total">₹{getCartTotal().toFixed(2)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 font-medium"
                data-testid="checkout-button"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
