import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { ShoppingBag, CreditCard, MapPin } from 'lucide-react';

const CheckoutPage = () => {
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const calculateItemPrice = (item) => {
    const basePrice = item.menu_item.price;
    if (item.menu_item.special_offer) {
      return basePrice * (1 - item.menu_item.special_offer / 100);
    }
    return basePrice;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!deliveryAddress.trim()) {
      toast.error('Please enter delivery address');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderItems = cartItems.map((item) => ({
        menu_item_id: item.menu_item.id,
        menu_item_name: item.menu_item.name,
        quantity: item.quantity,
        price: calculateItemPrice(item)
      }));

      const orderResponse = await axios.post(
        `${API}/orders/create`,
        {
          delivery_address: deliveryAddress,
          items: orderItems,
          total_amount: getCartTotal()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderId = orderResponse.data.order_id;

      // Create Stripe checkout session
      const originUrl = window.location.origin;
      const checkoutResponse = await axios.post(
        `${API}/payments/checkout`,
        {
          order_id: orderId,
          origin_url: originUrl
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to Stripe
      window.location.href = checkoutResponse.data.url;
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error(error.response?.data?.detail || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
          <h2 className="font-heading text-3xl text-foreground mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Add some delicious items to get started!</p>
          <Button
            onClick={() => navigate('/menu')}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6"
            data-testid="browse-menu-button"
          >
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4" data-testid="checkout-page">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-4xl text-foreground mb-8">Checkout</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-orange-100">
              <h2 className="font-heading text-2xl text-foreground mb-6 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" />
                Order Summary
              </h2>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-orange-100 last:border-0" data-testid={`checkout-item-${item.id}`}>
                    <img
                      src={item.menu_item.image}
                      alt={item.menu_item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.menu_item.name}</h3>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      <p className="text-primary font-semibold mt-1">
                        ₹{(calculateItemPrice(item) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-orange-100">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount</span>
                  <span className="text-primary text-2xl" data-testid="checkout-total">₹{getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-orange-100">
              <h2 className="font-heading text-2xl text-foreground mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                Delivery Details
              </h2>

              <form onSubmit={handleCheckout} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your complete delivery address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                    rows={4}
                    className="rounded-xl border-orange-100 focus:border-primary"
                    data-testid="delivery-address-input"
                  />
                </div>

                <div className="bg-[#FDF0D5] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Secure Payment</p>
                      <p className="text-muted-foreground">
                        You'll be redirected to our secure payment gateway to complete your order
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6 text-lg font-medium"
                  data-testid="proceed-to-payment-button"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
