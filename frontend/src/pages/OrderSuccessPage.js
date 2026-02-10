import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [orderDetails, setOrderDetails] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const { token } = useAuth();
  const navigate = useNavigate();

  const sessionId = searchParams.get('session_id');
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;
  const MAX_POLLING_ATTEMPTS = 5;

  const checkPaymentStatus = useCallback(async () => {
    if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        setOrderDetails(response.data);
      } else if (response.data.status === 'expired') {
        setStatus('failed');
      } else {
        // Continue polling
        setTimeout(() => {
          setPollingAttempts((prev) => prev + 1);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      setStatus('failed');
    }
  }, [API, sessionId, token, pollingAttempts, MAX_POLLING_ATTEMPTS]);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }
    checkPaymentStatus();
  }, [sessionId, navigate, checkPaymentStatus]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16 px-4" data-testid="order-success-page">
      <div className="max-w-md w-full">
        {status === 'checking' && (
          <div className="bg-white rounded-2xl p-12 text-center border border-orange-100 shadow-lg">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
            <h2 className="font-heading text-2xl text-foreground mb-4">
              Processing Your Payment
            </h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl p-12 text-center border border-orange-100 shadow-lg" data-testid="payment-success">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-secondary" />
            </div>
            <h2 className="font-heading text-3xl text-foreground mb-4">
              Order Placed Successfully!
            </h2>
            <p className="text-muted-foreground mb-8">
              Thank you for your order. Your delicious food is being prepared and will be delivered soon!
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/orders')}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6"
                data-testid="view-orders-button"
              >
                View My Orders
              </Button>
              <Button
                onClick={() => navigate('/menu')}
                variant="outline"
                className="w-full border-2 border-primary/20 hover:bg-primary/5 rounded-full py-6"
                data-testid="continue-shopping-button"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}

        {(status === 'failed' || status === 'timeout') && (
          <div className="bg-white rounded-2xl p-12 text-center border border-orange-100 shadow-lg" data-testid="payment-failed">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="font-heading text-3xl text-foreground mb-4">
              {status === 'timeout' ? 'Payment Status Check Timed Out' : 'Payment Failed'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {status === 'timeout'
                ? 'We are still processing your payment. Please check your orders or email for confirmation.'
                : 'Your payment could not be processed. Please try again.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/orders')}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-6"
                data-testid="check-orders-button"
              >
                Check My Orders
              </Button>
              <Button
                onClick={() => navigate('/checkout')}
                variant="outline"
                className="w-full border-2 border-primary/20 hover:bg-primary/5 rounded-full py-6"
                data-testid="try-again-button"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSuccessPage;
