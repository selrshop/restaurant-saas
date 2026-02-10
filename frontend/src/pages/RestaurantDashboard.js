import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Store, Package, DollarSign, TrendingUp, LogOut, Menu as MenuIcon } from 'lucide-react';
import { toast } from 'sonner';

const RestaurantDashboard = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const [restaurantRes, analyticsRes] = await Promise.all([
        axios.get(`${API}/restaurants/my/restaurant`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
        axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!restaurantRes || !restaurantRes.data) {
        // No restaurant yet, redirect to onboarding
        navigate('/onboarding');
        return;
      }

      setRestaurant(restaurantRes.data);

      // Fetch analytics if restaurant exists
      const analyticsData = await axios.get(
        `${API}/restaurants/${restaurantRes.data.id}/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(analyticsData.data);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status === 404) {
        navigate('/onboarding');
      } else if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCF5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]"></div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800'
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5]" data-testid="restaurant-dashboard">
      {/* Top Bar */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6 text-[#F05A28]" />
              <h1 className="font-heading text-xl text-[#111827]">
                {restaurant.name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[restaurant.status]}`}>
                {restaurant.status}
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-[#4B5563] hover:text-[#F05A28]"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alert */}
        {restaurant.status === 'pending' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded" data-testid="pending-alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your restaurant is pending approval. Our team will review and activate it soon!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {analytics?.total_orders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#F05A28]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Completed</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {analytics?.completed_orders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#0F766E]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    ₹{analytics?.total_revenue?.toFixed(0) || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Menu Items</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {analytics?.menu_items_count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MenuIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-2 border-orange-100">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-[#111827]">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate(`/r/${restaurant.slug}`)}
                className="bg-[#F05A28] hover:bg-[#C2410C] text-white rounded-lg h-20"
                data-testid="view-storefront-button"
              >
                <div className="text-center">
                  <Store className="w-6 h-6 mx-auto mb-1" />
                  <p>View Your Storefront</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="border-2 border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white rounded-lg h-20"
                data-testid="manage-menu-button"
                disabled
              >
                <div className="text-center">
                  <MenuIcon className="w-6 h-6 mx-auto mb-1" />
                  <p>Manage Menu</p>
                  <p className="text-xs">(Coming Soon)</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="border-2 border-orange-200 text-[#4B5563] hover:bg-orange-50 rounded-lg h-20"
                data-testid="view-orders-button"
                disabled
              >
                <div className="text-center">
                  <Package className="w-6 h-6 mx-auto mb-1" />
                  <p>View Orders</p>
                  <p className="text-xs">(Coming Soon)</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Info */}
        <div className="mt-8">
          <Card className="border-2 border-orange-100">
            <CardHeader>
              <CardTitle className="font-heading text-2xl text-[#111827]">
                Restaurant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Website URL</p>
                  <p className="text-[#111827] font-medium">
                    {window.location.origin}/r/{restaurant.slug}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Cuisine Types</p>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisine_types.map((cuisine, index) => (
                      <span key={index} className="bg-orange-100 text-[#F05A28] px-3 py-1 rounded-full text-sm">
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Address</p>
                  <p className="text-[#111827]">{restaurant.address}</p>
                </div>
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Phone</p>
                  <p className="text-[#111827]">{restaurant.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
