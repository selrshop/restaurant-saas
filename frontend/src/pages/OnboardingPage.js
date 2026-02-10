import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Store, CheckCircle } from 'lucide-react';

const OnboardingPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: '',
    description: '',
    cuisine_types: '',
    address: '',
    phone: '',
    logo: '',
    cover_image: ''
  });

  const navigate = useNavigate();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const cuisineArray = formData.cuisine_types.split(',').map(c => c.trim());

      await axios.post(
        `${API}/restaurants/create`,
        {
          ...formData,
          cuisine_types: cuisineArray
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Restaurant created! Pending admin approval.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCF5] to-white py-12 px-4" data-testid="onboarding-page">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F05A28] to-[#F59E0B] rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-4xl text-[#111827] mb-2">
            Setup Your Restaurant
          </h1>
          <p className="text-[#4B5563] text-lg">
            Let's create your online presence
          </p>
        </div>

        <Card className="border-2 border-orange-100">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-[#111827]">
              Restaurant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Desi Food Kart"
                    required
                    className="rounded-lg border-orange-100"
                    data-testid="name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Website URL *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#4B5563]">yoursite.com/r/</span>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="desi-food-kart"
                      required
                      className="rounded-lg border-orange-100"
                      data-testid="slug-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      placeholder="desifood"
                      className="rounded-lg border-orange-100"
                      data-testid="subdomain-input"
                    />
                    <span className="text-sm text-[#4B5563]">.yoursite.com</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your restaurant..."
                    required
                    rows={3}
                    className="rounded-lg border-orange-100"
                    data-testid="description-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuisine_types">Cuisine Types *</Label>
                  <Input
                    id="cuisine_types"
                    name="cuisine_types"
                    value={formData.cuisine_types}
                    onChange={handleChange}
                    placeholder="North Indian, Punjabi, Tandoori (comma separated)"
                    required
                    className="rounded-lg border-orange-100"
                    data-testid="cuisine-input"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Full address"
                      required
                      className="rounded-lg border-orange-100"
                      data-testid="address-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Contact number"
                      required
                      className="rounded-lg border-orange-100"
                      data-testid="phone-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL (Optional)</Label>
                  <Input
                    id="logo"
                    name="logo"
                    value={formData.logo}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.jpg"
                    className="rounded-lg border-orange-100"
                    data-testid="logo-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_image">Cover Image URL (Optional)</Label>
                  <Input
                    id="cover_image"
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleChange}
                    placeholder="https://example.com/cover.jpg"
                    className="rounded-lg border-orange-100"
                    data-testid="cover-input"
                  />
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#0F766E] mt-0.5" />
                  <div className="text-sm text-[#4B5563]">
                    <p className="font-medium text-[#111827] mb-1">What happens next?</p>
                    <p>Your restaurant will be submitted for approval. Once approved by our admin team, your website will go live and you can start accepting orders!</p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F05A28] hover:bg-[#C2410C] text-white rounded-full py-6 font-medium text-lg"
                data-testid="submit-button"
              >
                {loading ? 'Creating Restaurant...' : 'Create Restaurant'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
