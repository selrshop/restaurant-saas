import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Star, Clock, MapPin, Phone, Search, ShoppingCart, Flame, Award, Users } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const RestaurantStorefrontPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const { isAuthenticated, user } = useAuth();
  const { getCartCount } = useCart();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    if (slug) {
      fetchRestaurantData();
    }
  }, [slug]);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      const restaurantRes = await axios.get(`${API}/restaurants/slug/${slug}`);
      setRestaurant(restaurantRes.data);
      
      const restaurantId = restaurantRes.data.id;
      const [cats, items] = await Promise.all([
        axios.get(`${API}/restaurants/${restaurantId}/menu/categories`),
        axios.get(`${API}/restaurants/${restaurantId}/menu/items`)
      ]);
      
      setCategories(cats.data);
      setMenuItems(items.data);
    } catch (error) {
      console.error('Failed to fetch restaurant data:', error);
      toast.error('Restaurant not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (menuItemId, variant) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/cart/add`,
        {
          menu_item_id: menuItemId,
          variant_name: variant.name,
          quantity: 1
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`${variant.name} added to cart!`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const getSpiceLevel = (level) => {
    return Array(level).fill('🌶️').join('');
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#F05A28]"></div>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="min-h-screen bg-white" data-testid="restaurant-storefront">
      {/* Top Nav Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-6">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="icon"
                className="text-[#4B5563] hover:text-[#F05A28]"
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                {restaurant.logo && (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-12 h-12 rounded-lg object-cover border"
                  />
                )}
                <div>
                  <h1 className="font-heading text-xl text-[#111827] leading-tight">
                    {restaurant.name}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-[#4B5563]">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="font-medium">4.5</span>
                    </div>
                    <span>•</span>
                    <span>30-40 min</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cart Button */}
            <Button
              onClick={() => navigate('/cart')}
              className="bg-[#F05A28] hover:bg-[#C2410C] text-white rounded-lg px-6 relative"
              data-testid="cart-button"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#0F766E] text-white text-xs rounded-full flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={restaurant.cover_image || restaurant.logo}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {restaurant.cuisine_types.map((cuisine, index) => (
                <span
                  key={index}
                  className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium"
                >
                  {cuisine}
                </span>
              ))}
            </div>
            <p className="text-white/90 text-lg max-w-2xl">{restaurant.description}</p>
            
            <div className="flex flex-wrap gap-6 mt-4 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span className="text-sm">{restaurant.address.split(',')[0]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                <span className="text-sm">{restaurant.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="border-b bg-[#FFFCF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-[#F59E0B] fill-[#F59E0B]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#111827]">4.5</p>
                <p className="text-xs text-[#4B5563]">Rating</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#0F766E]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#111827]">30-40</p>
                <p className="text-xs text-[#4B5563]">Minutes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#111827]">500+</p>
                <p className="text-xs text-[#4B5563]">Orders</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white rounded-xl p-4 border">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#111827]">2K+</p>
                <p className="text-xs text-[#4B5563]">Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-20 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
              <Input
                type="text"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-full border-2 border-orange-100 focus:border-[#F05A28] h-12"
                data-testid="search-input"
              />
            </div>
            
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#F05A28] text-white'
                    : 'bg-orange-50 text-[#F05A28] hover:bg-orange-100'
                }`}
                data-testid="category-all"
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-[#F05A28] text-white'
                      : 'bg-orange-50 text-[#F05A28] hover:bg-orange-100'
                  }`}
                  data-testid={`category-${category.id}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20" data-testid="no-items">
            <p className="text-[#4B5563] text-lg">No items found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border-2 border-orange-100 hover:border-[#F05A28] hover:shadow-lg transition-all p-6"
                data-testid={`menu-item-${item.id}`}
              >
                <div className="flex gap-6">
                  {/* Item Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-40 h-40 rounded-xl object-cover"
                    />
                    {item.is_veg ? (
                      <div className="absolute top-3 left-3 w-6 h-6 border-2 border-[#0F766E] rounded flex items-center justify-center bg-white">
                        <div className="w-3 h-3 rounded-full bg-[#0F766E]"></div>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3 w-6 h-6 border-2 border-red-600 rounded flex items-center justify-center bg-white">
                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                      </div>
                    )}
                    {item.rating >= 4.5 && (
                      <div className="absolute bottom-3 left-3 bg-[#0F766E] text-white px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium">
                        <Star className="w-3 h-3 fill-white" />
                        {item.rating}
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-heading text-2xl text-[#111827] mb-1">
                          {item.name}
                        </h3>
                        <p className="text-[#4B5563] text-sm leading-relaxed max-w-2xl">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm text-[#4B5563]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.prep_time} min</span>
                      </div>
                      {item.spice_level > 0 && (
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-[#F05A28]" />
                          <span>{getSpiceLevel(item.spice_level)}</span>
                        </div>
                      )}
                    </div>

                    {/* Variants */}
                    <div className="flex flex-wrap gap-3">
                      {item.variants.map((variant, vIndex) => (
                        <div
                          key={vIndex}
                          className="flex items-center justify-between bg-[#FFFCF5] border-2 border-orange-100 rounded-xl px-5 py-3 min-w-[200px]"
                          data-testid={`variant-${item.id}-${vIndex}`}
                        >
                          <div>
                            <p className="text-xs text-[#4B5563] font-medium mb-1">
                              {variant.name}
                            </p>
                            <p className="text-2xl font-bold text-[#111827]">
                              ₹{variant.price}
                            </p>
                          </div>
                          <Button
                            onClick={() => addToCart(item.id, variant)}
                            disabled={!variant.available}
                            size="sm"
                            className="bg-[#F05A28] hover:bg-[#C2410C] text-white rounded-lg font-semibold px-6 h-10"
                            data-testid={`add-variant-${item.id}-${vIndex}`}
                          >
                            ADD
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantStorefrontPage;
