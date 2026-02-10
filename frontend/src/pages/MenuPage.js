import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Star, Clock, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const MenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [isVeg, setIsVeg] = useState(null);
  const [spiceLevel, setSpiceLevel] = useState(null);
  const { addToCart } = useCart();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/menu/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [API]);

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (isVeg !== null) params.append('is_veg', isVeg);
      if (spiceLevel !== null) params.append('spice_level', spiceLevel);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API}/menu/items?${params.toString()}`);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  }, [API, selectedCategory, isVeg, spiceLevel, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMenuItems();
  };

  const getSpiceLevel = (level) => {
    return Array(level).fill('🌶️').join('');
  };

  const calculateDiscountedPrice = (price, discount) => {
    if (!discount) return price;
    return price * (1 - discount / 100);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4" data-testid="menu-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
            Our Menu
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore our delicious selection of authentic Indian dishes
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-orange-100 focus:border-primary"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white rounded-xl" data-testid="search-button">
                Search
              </Button>
            </div>
          </form>

          <div className="flex flex-wrap gap-4">
            <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}>
              <SelectTrigger className="w-[200px] rounded-xl border-orange-100" data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={isVeg === null ? 'all' : isVeg.toString()} onValueChange={(val) => setIsVeg(val === 'all' ? null : val === 'true')}>
              <SelectTrigger className="w-[150px] rounded-xl border-orange-100" data-testid="veg-filter">
                <SelectValue placeholder="All Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="true">Veg Only</SelectItem>
                <SelectItem value="false">Non-Veg</SelectItem>
              </SelectContent>
            </Select>

            <Select value={spiceLevel === null ? 'all' : spiceLevel.toString()} onValueChange={(val) => setSpiceLevel(val === 'all' ? null : parseInt(val))}>
              <SelectTrigger className="w-[180px] rounded-xl border-orange-100" data-testid="spice-filter">
                <SelectValue placeholder="Spice Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="0">No Spice</SelectItem>
                <SelectItem value="1">Mild (🌶️)</SelectItem>
                <SelectItem value="2">Medium (🌶️🌶️)</SelectItem>
                <SelectItem value="3">Hot (🌶️🌶️🌶️)</SelectItem>
                <SelectItem value="4">Extra Hot (🌶️🌶️🌶️🌶️)</SelectItem>
              </SelectContent>
            </Select>

            {(selectedCategory || isVeg !== null || spiceLevel !== null) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedCategory('');
                  setIsVeg(null);
                  setSpiceLevel(null);
                  setSearchQuery('');
                }}
                className="text-primary hover:bg-primary/5"
                data-testid="clear-filters-button"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Menu Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : menuItems.length === 0 ? (
          <div className="text-center py-12" data-testid="no-items">
            <p className="text-muted-foreground text-lg">No items found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-orange-100 hover:border-orange-200 transition-all duration-300 hover:shadow-xl group"
                data-testid={`menu-item-${item.id}`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {item.special_offer && (
                    <div className="absolute top-4 right-4 bg-accent text-foreground px-3 py-1 rounded-full text-sm font-semibold">
                      {item.special_offer}% OFF
                    </div>
                  )}
                  {item.is_veg ? (
                    <div className="absolute top-4 left-4 w-6 h-6 border-2 border-secondary rounded flex items-center justify-center bg-white">
                      <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    </div>
                  ) : (
                    <div className="absolute top-4 left-4 w-6 h-6 border-2 border-destructive rounded flex items-center justify-center bg-white">
                      <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-xl text-foreground mb-2">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span>{item.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{item.prep_time} min</span>
                    </div>
                    {item.spice_level > 0 && (
                      <span>{getSpiceLevel(item.spice_level)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        ₹{calculateDiscountedPrice(item.price, item.special_offer).toFixed(2)}
                      </span>
                      {item.special_offer && (
                        <span className="ml-2 text-sm line-through text-muted-foreground">
                          ₹{item.price}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={() => addToCart(item.id)}
                      className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
                      data-testid={`add-to-cart-${item.id}`}
                    >
                      Add
                    </Button>
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

export default MenuPage;
