import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, MapPin, Star, ChefHat } from 'lucide-react';

const MarketplacePage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/restaurants?status=active`);
      setRestaurants(response.data);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisine_types.some(cuisine => cuisine.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FFFCF5]" data-testid="marketplace-page">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl text-[#111827]">
                Discover Restaurants
              </h1>
              <p className="text-[#4B5563] mt-1">
                Order from your favorite local restaurants
              </p>
            </div>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-[#F05A28] text-[#F05A28] hover:bg-orange-50"
              data-testid="back-home-button"
            >
              Back to Home
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
            <Input
              type="text"
              placeholder="Search restaurants or cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-xl border-orange-100 focus:border-[#F05A28] py-6"
              data-testid="search-input"
            />
          </div>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F05A28]"></div>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-20" data-testid="no-restaurants">
            <ChefHat className="w-20 h-20 text-[#4B5563] mx-auto mb-4" />
            <h2 className="font-heading text-2xl text-[#111827] mb-2">No restaurants found</h2>
            <p className="text-[#4B5563]">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => navigate(`/r/${restaurant.slug}`)}
                className="bg-white rounded-2xl overflow-hidden border border-orange-100 hover:shadow-xl transition-all duration-300 cursor-pointer group"
                data-testid={`restaurant-card-${restaurant.id}`}
              >
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={restaurant.cover_image || restaurant.logo || 'https://images.pexels.com/photos/9266190/pexels-photo-9266190.jpeg'}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Logo */}
                  {restaurant.logo && (
                    <div className="absolute bottom-4 left-4">
                      <img
                        src={restaurant.logo}
                        alt={`${restaurant.name} logo`}
                        className="w-16 h-16 rounded-xl border-2 border-white object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-heading text-2xl text-[#111827] mb-2">
                    {restaurant.name}
                  </h3>
                  <p className="text-[#4B5563] text-sm mb-4 line-clamp-2">
                    {restaurant.description}
                  </p>

                  {/* Cuisine Types */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {restaurant.cuisine_types.slice(0, 3).map((cuisine, index) => (
                      <span
                        key={index}
                        className="bg-orange-100 text-[#F05A28] px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>

                  {/* Location & Rating */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-[#4B5563]">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{restaurant.address.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#F59E0B]">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">4.5</span>
                    </div>
                  </div>

                  {/* View Menu Button */}
                  <Button
                    className="w-full mt-4 bg-[#F05A28] hover:bg-[#C2410C] text-white rounded-full"
                    data-testid={`view-menu-${restaurant.id}`}
                  >
                    View Menu
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
