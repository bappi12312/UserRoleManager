import { Product } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Star, StarHalf } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Generate star rating display
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="fill-amber-400 text-amber-400" size={14} />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="fill-amber-400 text-amber-400" size={14} />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300" size={14} />);
    }
    
    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-48 object-cover" 
        />
        <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-medium px-2 py-1 rounded-full">
          {product.commission}% Commission
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-800 mb-1">{product.name}</h3>
        <div className="flex items-center mb-2">
          <div className="flex text-amber-400 text-sm">
            {renderRating(product.rating)}
          </div>
          <span className="text-xs text-gray-500 ml-1">({product.reviewCount})</span>
        </div>
        <p className="text-gray-600 text-sm mb-3">
          {product.description.length > 80 
            ? `${product.description.substring(0, 80)}...` 
            : product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-800">{formatCurrency(product.price)}</span>
          <Link href={`/products/${product.id}`}>
            <Button
              size="sm"
              className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded transition"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
