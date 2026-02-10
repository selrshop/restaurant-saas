import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      const response = await axios.post(`${API}/auth/login`, formData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      toast.success('Login successful!');

      // Redirect based on role
      if (user.role === 'super_admin') {
        navigate('/admin');
      } else if (user.role === 'restaurant_owner') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCF5] to-white flex items-center justify-center px-4 py-12" data-testid="login-page">
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
              Welcome Back
            </CardTitle>
            <p className="text-center text-[#4B5563] mt-2">
              Login to your account
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
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
                data-testid="login-button"
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <div className="text-center text-sm text-[#4B5563]">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-[#F05A28] hover:underline font-medium"
                  data-testid="signup-link"
                >
                  Sign up
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-orange-100">
              <p className="text-xs text-center text-[#4B5563] mb-3">Test Credentials:</p>
              <div className="space-y-1 text-xs text-[#4B5563]">
                <p>Owner: owner1@desifoodkart.com / password123</p>
                <p>Admin: admin@restaurantsaas.com / password123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
