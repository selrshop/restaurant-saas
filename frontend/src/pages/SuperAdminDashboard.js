import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Store, TrendingUp, DollarSign, Users, LogOut, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';

const SuperAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [analyticsRes, restaurantsRes] = await Promise.all([
        axios.get(`${API}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/restaurants`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAnalytics(analyticsRes.data);
      setRestaurants(restaurantsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [API]);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const userRes = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userRes.data.role !== 'super_admin') {
        toast.error('Access denied. Super admin only.');
        navigate('/');
        return;
      }

      fetchData();
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    }
  }, [API, navigate, fetchData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleApprove = async (restaurantId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/restaurants/${restaurantId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Restaurant approved!');
      fetchData();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve restaurant');
    }
  };

  const handleSuspend = async (restaurantId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/restaurants/${restaurantId}/suspend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Restaurant suspended');
      fetchData();
    } catch (error) {
      console.error('Failed to suspend:', error);
      toast.error('Failed to suspend restaurant');
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

  const pendingRestaurants = restaurants.filter(r => r.status === 'pending');
  const activeRestaurants = restaurants.filter(r => r.status === 'active');
  const suspendedRestaurants = restaurants.filter(r => r.status === 'suspended');

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    active: 'bg-green-100 text-green-800 border-green-200',
    suspended: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <div className="min-h-screen bg-[#FFFCF5]" data-testid="admin-dashboard">
      {/* Top Bar */}
      <div className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#F05A28] to-[#F59E0B] rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-heading text-xl text-[#111827]">Super Admin</h1>
                <p className="text-xs text-[#4B5563]">Platform Management</p>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Total Restaurants</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {analytics?.total_restaurants || 0}
                  </p>
                  <p className="text-xs text-[#0F766E] mt-1">
                    {analytics?.active_restaurants || 0} active
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-[#F05A28]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Pending Approvals</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {analytics?.pending_restaurants || 0}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Requires attention
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4B5563] mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {analytics?.total_orders || 0}
                  </p>
                  <p className="text-xs text-[#0F766E] mt-1">
                    Across all restaurants
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
                  <p className="text-sm text-[#4B5563] mb-1">Platform Revenue</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    ₹{analytics?.total_commission?.toFixed(0) || 0}
                  </p>
                  <p className="text-xs text-[#4B5563] mt-1">
                    Commission earned
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-orange-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'overview'
                ? 'border-b-2 border-[#F05A28] text-[#F05A28]'
                : 'text-[#4B5563] hover:text-[#F05A28]'
            }`}
            data-testid="tab-overview"
          >
            All Restaurants ({restaurants.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'pending'
                ? 'border-b-2 border-[#F05A28] text-[#F05A28]'
                : 'text-[#4B5563] hover:text-[#F05A28]'
            }`}
            data-testid="tab-pending"
          >
            Pending ({pendingRestaurants.length})
            {pendingRestaurants.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F05A28] text-white text-xs rounded-full flex items-center justify-center">
                {pendingRestaurants.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'active'
                ? 'border-b-2 border-[#F05A28] text-[#F05A28]'
                : 'text-[#4B5563] hover:text-[#F05A28]'
            }`}
            data-testid="tab-active"
          >
            Active ({activeRestaurants.length})
          </button>
        </div>

        {/* Restaurants List */}
        <div className="space-y-4">
          {(activeTab === 'overview' ? restaurants : 
            activeTab === 'pending' ? pendingRestaurants :
            activeRestaurants).map((restaurant) => (
            <Card key={restaurant.id} className="border-2 border-orange-100" data-testid={`restaurant-${restaurant.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Logo */}
                  {restaurant.logo && (
                    <img
                      src={restaurant.logo}
                      alt={restaurant.name}
                      className="w-24 h-24 rounded-xl object-cover border-2 border-orange-100"
                    />
                  )}

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-2xl text-[#111827]">
                            {restaurant.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[restaurant.status]}`}>
                            {restaurant.status}
                          </span>
                        </div>
                        <p className="text-[#4B5563] mb-2">{restaurant.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.cuisine_types.map((cuisine, index) => (
                            <span
                              key={index}
                              className="bg-orange-100 text-[#F05A28] px-3 py-1 rounded-full text-xs"
                            >
                              {cuisine}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
                      <div className="text-[#4B5563]">
                        <span className="font-medium">URL:</span> /r/{restaurant.slug}
                      </div>
                      <div className="text-[#4B5563]">
                        <span className="font-medium">Phone:</span> {restaurant.phone}
                      </div>
                      <div className="text-[#4B5563]">
                        <span className="font-medium">Address:</span> {restaurant.address}
                      </div>
                      <div className="text-[#4B5563]">
                        <span className="font-medium">Commission:</span> {restaurant.commission_rate}%
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => navigate(`/r/${restaurant.slug}`)}
                        variant="outline"
                        size="sm"
                        className="border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white"
                        data-testid={`view-${restaurant.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Storefront
                      </Button>

                      {restaurant.status === 'pending' && (
                        <Button
                          onClick={() => handleApprove(restaurant.id)}
                          size="sm"
                          className="bg-[#0F766E] hover:bg-[#0F766E]/90 text-white"
                          data-testid={`approve-${restaurant.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}

                      {restaurant.status === 'active' && (
                        <Button
                          onClick={() => handleSuspend(restaurant.id)}
                          size="sm"
                          variant="destructive"
                          data-testid={`suspend-${restaurant.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Suspend
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(activeTab === 'pending' && pendingRestaurants.length === 0) && (
            <div className="text-center py-12" data-testid="no-pending">
              <Clock className="w-16 h-16 text-[#4B5563] mx-auto mb-4" />
              <p className="text-[#4B5563] text-lg">No pending approvals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
