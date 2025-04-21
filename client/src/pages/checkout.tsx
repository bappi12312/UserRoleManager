import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Load the Stripe Promise outside the component
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing VITE_STRIPE_PUBLIC_KEY environment variable");
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Checkout form component
function CheckoutForm({ product }: { product: Product }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed");
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      // Payment succeeded
      setIsCompleted(true);
      toast({
        title: "Payment Successful",
        description: "Your order has been processed successfully!",
      });
      
      // Redirect to orders page after a short delay
      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-bold">Payment Successful!</h2>
        <p>Your order has been processed successfully.</p>
        <p>Redirecting to your orders...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatCurrency(product.price)}`
        )}
      </Button>
    </form>
  );
}

// Main checkout page component
export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Get the product ID from the URL query parameters
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("productId");

  useEffect(() => {
    // Redirect if no productId or user is not logged in
    if (!productId) {
      navigate("/products");
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchPaymentIntent = async () => {
      try {
        const res = await apiRequest("POST", "/api/create-payment-intent", {
          productId: parseInt(productId),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setClientSecret(data.clientSecret);
          setProduct(data.product);
        } else {
          setError(data.error || "Failed to initialize payment");
          toast({
            title: "Error",
            description: data.error || "Failed to initialize payment",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
        toast({
          title: "Error",
          description: err.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [productId, user, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="mb-4">{error || "Product not found"}</p>
        <Button onClick={() => navigate("/products")}>Return to Products</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-12 p-6">
      <h1 className="text-3xl font-bold mb-8">Complete Your Purchase</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Details of your purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              {product.imageUrl && (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-bold">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.description}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span>Price:</span>
                <span className="font-bold">{formatCurrency(product.price)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Enter your card information securely</CardDescription>
          </CardHeader>
          <CardContent>
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm product={product} />
              </Elements>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}