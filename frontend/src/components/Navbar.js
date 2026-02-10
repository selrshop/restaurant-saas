import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';

const Navbar = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" data-testid="navbar-logo">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span className="text-2xl">🍛</span>
              </div>
              <span className="font-heading text-2xl text-foreground">
                Desi Food Kart
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-foreground hover:text-primary font-medium transition-colors"
                data-testid="nav-home-link"
              >
                Home
              </Link>
              <Link
                to="/menu"
                className="text-foreground hover:text-primary font-medium transition-colors"
                data-testid="nav-menu-link"
              >
                Menu
              </Link>
              {isAuthenticated && (
                <Link
                  to="/orders"
                  className="text-foreground hover:text-primary font-medium transition-colors"
                  data-testid="nav-orders-link"
                >
                  My Orders
                </Link>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowCartDrawer(true)}
                data-testid="cart-button"
              >
                <ShoppingCart className="w-5 h-5" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center" data-testid="cart-count">
                    {getCartCount()}
                  </span>
                )}
              </Button>

              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground" data-testid="user-name">
                    {user?.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="border-primary/20 hover:bg-primary/5"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden md:flex bg-primary text-white hover:bg-primary/90 rounded-full px-6"
                  data-testid="login-button"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-orange-100" data-testid="mobile-menu">
              <div className="flex flex-col space-y-3">
                <Link
                  to="/"
                  className="text-foreground hover:text-primary font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-nav-home"
                >
                  Home
                </Link>
                <Link
                  to="/menu"
                  className="text-foreground hover:text-primary font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="mobile-nav-menu"
                >
                  Menu
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className="text-foreground hover:text-primary font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="mobile-nav-orders"
                  >
                    My Orders
                  </Link>
                )}
                {!isAuthenticated && (
                  <Button
                    onClick={() => {
                      setShowAuthModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="bg-primary text-white hover:bg-primary/90 rounded-full w-full"
                    data-testid="mobile-login-button"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                )}
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="border-primary/20 hover:bg-primary/5 w-full"
                    data-testid="mobile-logout-button"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <CartDrawer open={showCartDrawer} onClose={() => setShowCartDrawer(false)} />
    </>
  );
};

export default Navbar;
