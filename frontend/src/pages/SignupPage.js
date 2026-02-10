import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const SignupPage = () => {
  const [isRestaurantOwner, setIsRestaurantOwner] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'restaurant_owner'
  });

  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        ...formData,
        role: isRestaurantOwner ? 'restaurant_owner' : 'customer'
      });

      localStorage.setItem('token', response.data.token);
      toast.success('Account created successfully!');

      if (isRestaurantOwner) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCF5] to-white flex items-center justify-center px-4 py-12" data-testid="signup-page">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-[#4B5563] hover:text-[#F05A28]"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="border-2 border-orange-100">
          <CardHeader>
            <CardTitle className="font-heading text-3xl text-center text-[#111827]">
              Create Your Account
            </CardTitle>
            <p className="text-center text-[#4B5563] mt-2">
              Start your 14-day free trial
            </p>
          </CardHeader>
          <CardContent>
            {/* Role Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-orange-50 rounded-lg">
              <button
                type="button"
                onClick={() => setIsRestaurantOwner(true)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  isRestaurantOwner
                    ? 'bg-[#F05A28] text-white'
                    : 'text-[#4B5563] hover:text-[#F05A28]'
                }`}
                data-testid="toggle-restaurant"
              >
                Restaurant Owner
              </button>
              <button
                type="button"
                onClick={() => setIsRestaurantOwner(false)}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  !isRestaurantOwner
                    ? 'bg-[#F05A28] text-white'
                    : 'text-[#4B5563] hover:text-[#F05A28]'
                }`}
                data-testid="toggle-customer"
              >
                Customer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="rounded-lg border-orange-100 focus:border-[#F05A28]"
                  data-testid="name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="rounded-lg border-orange-100 focus:border-[#F05A28]"
                  data-testid="email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="rounded-lg border-orange-100 focus:border-[#F05A28]"
                  data-testid="phone-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="rounded-lg border-orange-100 focus:border-[#F05A28]"
                  data-testid="password-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F05A28] hover:bg-[#C2410C] text-white rounded-full py-6 font-medium"
                data-testid="signup-button"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm text-[#4B5563]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-[#F05A28] hover:underline font-medium"
                  data-testid="login-link"
                >
                  Login
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isRestaurantOwner && (
          <p className="text-center text-xs text-[#4B5563] mt-4">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
