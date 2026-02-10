import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
      case 'preparing':
        return <Clock className="w-5 h-5 text-accent" />;
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-primary" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-secondary" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Package className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'preparing':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'out_for_delivery':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'delivered':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4" data-testid="orders-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl text-foreground mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-orange-100" data-testid="no-orders">
            <Package className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="font-heading text-2xl text-foreground mb-4">No orders yet</h2>
            <p className="text-muted-foreground mb-8">Start ordering delicious food!</p>
            <Button
              onClick={() => navigate('/menu')}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6"
              data-testid="browse-menu-button"
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-6 border border-orange-100 hover:shadow-lg transition-shadow"
                data-testid={`order-${order.id}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">
                      Order #{order.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="font-medium text-sm">{getStatusText(order.status)}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm" data-testid={`order-item-${index}`}>
                      <span className="text-foreground">
                        {item.quantity}x {item.menu_item_name}
                      </span>
                      <span className="text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-orange-100">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                    <p className="text-sm text-foreground">{order.delivery_address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-xl font-bold text-primary" data-testid={`order-total-${order.id}`}>
                      ₹{order.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-orange-100">
                  <span className="text-sm text-muted-foreground">Payment:</span>
                  <span className={`text-sm font-medium ${order.payment_status === 'paid' ? 'text-secondary' : 'text-muted-foreground'}`}>
                    {order.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
