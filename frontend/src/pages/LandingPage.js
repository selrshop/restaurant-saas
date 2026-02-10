import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Check, Store, TrendingUp, DollarSign, Users, ChefHat, Smartphone, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFCF5] to-white" data-testid="landing-page">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F05A28] to-[#F59E0B] rounded-full flex items-center justify-center">
                <Store className="w-7 h-7 text-white" />
              </div>
              <span className="font-heading text-2xl text-[#111827]">RestaurantSaaS</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-[#4B5563] hover:text-[#F05A28]"
                data-testid="nav-login-button"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                className="bg-[#F05A28] hover:bg-[#C2410C] text-white rounded-full px-6"
                data-testid="nav-signup-button"
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block bg-orange-100 text-[#F05A28] px-4 py-2 rounded-full text-sm font-medium mb-6">
            🚀 Shopify for Restaurants
          </div>
          <h1 className="font-heading text-5xl md:text-7xl text-[#111827] mb-6 leading-tight">
            Launch Your <span className="text-[#F05A28]">Online Restaurant</span><br />
            in Minutes, Not Months
          </h1>
          <p className="text-xl text-[#4B5563] mb-10 max-w-3xl mx-auto">
            The all-in-one platform for restaurants and cloud kitchens to accept online orders,
            manage menus, and grow their business. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/signup')}
              className="bg-[#F05A28] hover:bg-[#C2410C] text-white rounded-full px-10 py-6 text-lg font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              data-testid="hero-signup-button"
            >
              Start Free Trial
            </Button>
            <Button
              onClick={() => navigate('/r/desi-food-kart')}
              variant="outline"
              className="border-2 border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white rounded-full px-10 py-6 text-lg font-medium transition-all"
              data-testid="hero-demo-button"
            >
              View Demo Restaurant
            </Button>
          </div>
          <div className="mt-10 text-sm text-[#4B5563]">
            ✓ 14-day free trial  ✓ No credit card required  ✓ Cancel anytime
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl text-[#111827] mb-4">
              Everything You Need to Run Your Restaurant Online
            </h2>
            <p className="text-lg text-[#4B5563]">
              Powerful features designed specifically for food businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ChefHat className="w-8 h-8" />,
                title: "Easy Menu Management",
                description: "Add dishes with variants (Half/Full/Mini). Update prices and availability in real-time."
              },
              {
                icon: <Smartphone className="w-8 h-8" />,
                title: "Your Own Storefront",
                description: "Get a beautiful, branded online storefront. Custom URL and subdomain included."
              },
              {
                icon: <DollarSign className="w-8 h-8" />,
                title: "Secure Payments",
                description: "Accept payments via Razorpay. Money directly deposited to your account."
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Real-time Analytics",
                description: "Track orders, revenue, and popular items. Make data-driven decisions."
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Customer Management",
                description: "Build your customer base. Send updates about new items and offers."
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Growth Tools",
                description: "SEO optimization, social media integration, and marketing tools built-in."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-orange-100 p-8 hover:shadow-lg transition-all hover:-translate-y-1"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-[#F05A28] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#111827] mb-2">{feature.title}</h3>
                <p className="text-[#4B5563]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl text-[#111827] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-[#4B5563]">
              Choose the plan that fits your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "₹999",
                period: "/month",
                features: [
                  "Up to 25 menu items",
                  "Online ordering",
                  "Custom storefront",
                  "Basic analytics",
                  "Email support"
                ],
                cta: "Start Free Trial",
                popular: false
              },
              {
                name: "Growth",
                price: "₹2,499",
                period: "/month",
                features: [
                  "Up to 100 menu items",
                  "Everything in Starter",
                  "Advanced analytics",
                  "Priority support",
                  "Custom subdomain",
                  "Marketing tools"
                ],
                cta: "Start Free Trial",
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                features: [
                  "Unlimited menu items",
                  "Everything in Growth",
                  "Multiple locations",
                  "API access",
                  "Dedicated account manager",
                  "Custom integrations"
                ],
                cta: "Contact Sales",
                popular: false
              }
            ].map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl border-2 p-8 ${
                  plan.popular ? 'border-[#F05A28] shadow-xl scale-105' : 'border-orange-100'
                }`}
                data-testid={`pricing-card-${index}`}
              >
                {plan.popular && (
                  <div className="bg-[#F05A28] text-white px-3 py-1 rounded-full text-sm font-medium inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-[#111827] mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#111827]">{plan.price}</span>
                  <span className="text-[#4B5563]">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2 text-[#4B5563]">
                      <Check className="w-5 h-5 text-[#0F766E] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate('/signup')}
                  className={`w-full rounded-full py-6 font-medium ${
                    plan.popular
                      ? 'bg-[#F05A28] hover:bg-[#C2410C] text-white'
                      : 'bg-white border-2 border-[#0F766E] text-[#0F766E] hover:bg-[#0F766E] hover:text-white'
                  }`}
                  data-testid={`pricing-cta-${index}`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#F05A28] to-[#F59E0B]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="font-heading text-4xl md:text-5xl mb-6">
            Ready to Grow Your Restaurant?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Join hundreds of restaurants already using our platform
          </p>
          <Button
            onClick={() => navigate('/signup')}
            className="bg-white text-[#F05A28] hover:bg-gray-100 rounded-full px-10 py-6 text-lg font-medium"
            data-testid="cta-signup-button"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111827] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#F05A28] to-[#F59E0B] rounded-full flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl">RestaurantSaaS</span>
          </div>
          <p className="text-gray-400">
            © 2024 RestaurantSaaS. The easiest way to take your restaurant online.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
