import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { ArrowRight, Star, Clock, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, featuredRes] = await Promise.all([
        axios.get(`${API}/menu/categories`),
        axios.get(`${API}/menu/featured`)
      ]);
      setCategories(categoriesRes.data);
      setFeaturedItems(featuredRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSpiceLevel = (level) => {
    return Array(level).fill('🌶️').join('');
  };

  const calculateDiscountedPrice = (price, discount) => {
    if (!discount) return price;
    return price * (1 - discount / 100);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-[#FDF0D5] to-background py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="font-heading text-5xl md:text-7xl text-foreground leading-none" data-testid="hero-title">
                Authentic
                <span className="text-primary block mt-2">Desi Flavors</span>
                Delivered Fast
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Experience the rich taste of traditional Indian cuisine, prepared fresh with
                authentic spices and delivered to your doorstep.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate('/menu')}
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg font-medium hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                  data-testid="order-now-button"
                >
                  Order Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/menu')}
                  className="border-2 border-primary/20 hover:bg-primary/5 rounded-full px-8 py-6 text-lg font-medium transition-colors"
                  data-testid="view-menu-button"
                >
                  View Menu
                </Button>
              </div>
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">4.8★</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">30min</div>
                  <div className="text-sm text-muted-foreground">Avg Delivery</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/9266190/pexels-photo-9266190.jpeg"
                  alt="Delicious Indian food"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Flame className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Special Offers</div>
                    <div className="font-semibold text-primary">Up to 20% OFF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4" data-testid="categories-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore our diverse menu of authentic Indian dishes
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/menu?category=${category.id}`}
                className="group"
                data-testid={`category-${category.id}`}
              >
                <div className="aspect-square relative overflow-hidden rounded-2xl cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-center">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="py-16 px-4 bg-[#FDF0D5]/30" data-testid="featured-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
              Special Offers
            </h2>
            <p className="text-lg text-muted-foreground">
              Don't miss out on these amazing deals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-orange-100 hover:border-orange-200 transition-all duration-300 hover:shadow-xl group"
                data-testid={`featured-item-${item.id}`}
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
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate('/menu')}
              variant="outline"
              className="border-2 border-primary/20 hover:bg-primary/5 rounded-full px-8 py-6 text-lg font-medium"
              data-testid="view-all-button"
            >
              View All Menu Items
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
