import { useQuery, useMutation } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { Product } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Star, StarHalf, ShoppingCart, Share2, CreditCard } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export default function ProductDetails({ id }: { id: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");
  const [_, navigate] = useLocation();
  
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });
  
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        productId: id,
        referralCode: referralCode || undefined
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${product?.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "There was an error processing your purchase",
        variant: "destructive",
      });
    }
  });
  
  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase this product",
        variant: "destructive",
      });
      return;
    }
    
    purchaseMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      </AppLayout>
    );
  }
  
  if (!product) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-gray-700">Product not found</h3>
            <p className="text-gray-500 mt-2">The product you are looking for does not exist or has been removed.</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // Generate star rating display
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="fill-amber-400 text-amber-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="fill-amber-400 text-amber-400" />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300" />);
    }
    
    return stars;
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg overflow-hidden shadow-md">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-96 object-cover"
            />
          </div>
          
          {/* Product Details */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            
            <div className="flex items-center mb-3">
              <div className="flex text-sm">
                {renderRating(product.rating)}
              </div>
              <span className="text-sm text-gray-500 ml-2">({product.reviewCount} reviews)</span>
            </div>
            
            <div className="text-2xl font-bold text-gray-800 mb-4">
              {formatCurrency(product.price)}
            </div>
            
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                  <span className="text-primary-700 font-medium">%</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Commission Rate</h4>
                  <p className="text-sm text-gray-600">
                    Affiliators earn {product.commission}% on sales of this product
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <Label htmlFor="referral-code">Referral Code (Optional)</Label>
              <Input
                id="referral-code"
                placeholder="Enter a referral code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="mb-2"
              />
              <p className="text-sm text-gray-500">
                If you have a referral code, enter it to help the affiliator earn commission.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="flex-1"
                size="lg"
                variant="secondary"
                onClick={handlePurchase}
                disabled={purchaseMutation.isPending}
              >
                {purchaseMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-5 w-5" />
                )}
                Quick Purchase
              </Button>
              
              <Button 
                className="flex-1"
                size="lg"
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Authentication Required",
                      description: "Please log in to purchase this product",
                      variant: "destructive",
                    });
                    return;
                  }
                  navigate(`/checkout?productId=${id}&referralCode=${referralCode}`);
                }}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Card Payment
              </Button>
              
              <Button variant="outline" size="lg">
                <Share2 className="mr-2 h-5 w-5" />
                Share
              </Button>
            </div>
          </div>
        </div>
        
        <Separator className="my-10" />
        
        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">Get your products delivered within 2-4 business days.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">Quality Guarantee</h3>
              <p className="text-gray-600 text-sm">We stand behind the quality of all our products.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">30-Day Returns</h3>
              <p className="text-gray-600 text-sm">Not satisfied? Return within 30 days for a full refund.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
