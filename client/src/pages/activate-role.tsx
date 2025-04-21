import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Load the Stripe Promise outside the component
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing VITE_STRIPE_PUBLIC_KEY environment variable");
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface RoleActivationProps {
  clientSecret: string;
  role: UserRole;
  amount: number;
  referralCode: string;
}

// Payment form component
function RoleActivationForm({ clientSecret, role, amount, referralCode }: RoleActivationProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

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
        return_url: `${window.location.origin}/dashboard`,
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
        title: "Role Activation Successful",
        description: `Your account has been upgraded to ${role}!`,
      });
      
      // Invalidate user query to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-2xl font-bold">Activation Successful!</h2>
        <p>Your account has been upgraded to {role}.</p>
        <p>Redirecting to dashboard...</p>
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
          `Pay ${formatCurrency(amount)}`
        )}
      </Button>
    </form>
  );
}

// Role selection step
function RoleSelectionStep({ 
  onNext, 
  role, 
  setRole, 
  referralCode, 
  setReferralCode 
}: { 
  onNext: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  referralCode: string;
  setReferralCode: (code: string) => void;
}) {
  const { user } = useAuth();
  
  // Determine which roles the user can upgrade to
  const canUpgradeToActiveUser = user?.role === UserRole.USER;
  const canUpgradeToAffiliator = user?.role === UserRole.USER || user?.role === UserRole.ACTIVE_USER;
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upgrade Your Account</CardTitle>
        <CardDescription>Select a role to activate</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active User Option */}
        <div className={`border rounded-lg p-4 ${role === UserRole.ACTIVE_USER ? 'border-primary' : 'border-gray-200'} ${!canUpgradeToActiveUser ? 'opacity-50' : ''}`}>
          <div className="flex items-start">
            <input
              type="radio"
              id="activeUser"
              name="role"
              value={UserRole.ACTIVE_USER}
              checked={role === UserRole.ACTIVE_USER}
              onChange={() => setRole(UserRole.ACTIVE_USER)}
              disabled={!canUpgradeToActiveUser}
              className="mt-1"
            />
            <div className="ml-3">
              <label htmlFor="activeUser" className="font-medium">
                Active User
              </label>
              <p className="text-sm text-gray-500">
                Unlock basic benefits and earn commissions from your direct referrals
              </p>
              <p className="text-lg font-bold mt-2">
                {formatCurrency(50)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Affiliator Option */}
        <div className={`border rounded-lg p-4 ${role === UserRole.AFFILIATOR ? 'border-primary' : 'border-gray-200'} ${!canUpgradeToAffiliator ? 'opacity-50' : ''}`}>
          <div className="flex items-start">
            <input
              type="radio"
              id="affiliator"
              name="role"
              value={UserRole.AFFILIATOR}
              checked={role === UserRole.AFFILIATOR}
              onChange={() => setRole(UserRole.AFFILIATOR)}
              disabled={!canUpgradeToAffiliator}
              className="mt-1"
            />
            <div className="ml-3">
              <label htmlFor="affiliator" className="font-medium">
                Affiliator
              </label>
              <p className="text-sm text-gray-500">
                Unlock premium benefits and earn multi-level commissions from your entire network
              </p>
              <p className="text-lg font-bold mt-2">
                {formatCurrency(150)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Referral Code */}
        <div>
          <Label htmlFor="referralCode">Referral Code (Optional)</Label>
          <Input
            id="referralCode"
            placeholder="Enter a referral code"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a referral code to reward the person who referred you
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onNext}
          disabled={!(
            (role === UserRole.ACTIVE_USER && canUpgradeToActiveUser) || 
            (role === UserRole.AFFILIATOR && canUpgradeToAffiliator)
          )}
          className="w-full"
        >
          Continue to Payment
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main activation page component
export default function ActivateRolePage() {
  const [step, setStep] = useState<'selection' | 'payment'>('selection');
  const [role, setRole] = useState<UserRole>(UserRole.ACTIVE_USER);
  const [referralCode, setReferralCode] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // If user isn't logged in, redirect to auth page
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // If user is already an admin, redirect to dashboard
    if (user.role === UserRole.ADMIN) {
      toast({
        title: "Access Denied",
        description: "Admins cannot change their role",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
  }, [user, navigate, toast]);
  
  // Proceed to payment step
  const handleProceedToPayment = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest("POST", "/api/create-role-payment-intent", {
        role,
        referralCode: referralCode || undefined
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setStep('payment');
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={() => setStep('selection')}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto my-12 p-6">
      <h1 className="text-3xl font-bold mb-8">Activate Premium Role</h1>
      
      {step === 'selection' ? (
        <RoleSelectionStep 
          onNext={handleProceedToPayment}
          role={role}
          setRole={setRole}
          referralCode={referralCode}
          setReferralCode={setReferralCode}
        />
      ) : (
        clientSecret && (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Complete your payment to activate {role}</CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <RoleActivationForm 
                  clientSecret={clientSecret}
                  role={role}
                  amount={amount}
                  referralCode={referralCode}
                />
              </Elements>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setStep('selection')}
                disabled={isLoading}
              >
                Back to Selection
              </Button>
            </CardFooter>
          </Card>
        )
      )}
    </div>
  );
}