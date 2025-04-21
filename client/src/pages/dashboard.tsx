import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import StatsCard from "@/components/dashboard/stats-card";
import AccountStatus from "@/components/dashboard/account-status";
import RecentReferrals from "@/components/dashboard/recent-referrals";
import CommissionStructure from "@/components/dashboard/commission-structure";
import ProductCard from "@/components/products/product-card";
import { Product, User, Transaction } from "@shared/schema";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch referrals
  const { data: referrals = [] } = useQuery<User[]>({
    queryKey: ['/api/referrals'],
    enabled: !!user,
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });

  // Fetch orders
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user,
  });

  // Fetch products for featured products section
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Calculate total earnings
  const totalEarnings = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  // Get recent referrals (users referred by the current user)
  const recentReferrals = referrals.slice(0, 5);

  // Get featured products (first 4)
  const featuredProducts = products.slice(0, 4);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Dashboard Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.fullName?.split(' ')[0]}!</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Referrals"
            value={referrals.length}
            icon="user-add-line"
            change="+2 this month"
            iconBgColor="bg-blue-100"
            iconColor="text-primary-500"
          />
          
          <StatsCard
            title="Total Earnings"
            value={totalEarnings.toFixed(2)}
            icon="coin-line"
            change="+$45 this month"
            iconBgColor="bg-green-100"
            iconColor="text-success-500"
            isCurrency
          />
          
          <StatsCard
            title="Total Orders"
            value={orders.length}
            icon="shopping-cart-line"
            change="+1 this month"
            iconBgColor="bg-amber-100"
            iconColor="text-amber-500"
          />
          
          <StatsCard
            title="Active Downlines"
            value={referrals.filter(r => r.role !== "USER").length}
            icon="team-line"
            change="+3 this month"
            iconBgColor="bg-purple-100"
            iconColor="text-premium-500"
          />
        </div>
        
        {/* Account Status */}
        <AccountStatus currentUser={user} />
        
        {/* Recent Referrals */}
        <RecentReferrals referrals={recentReferrals} />
        
        {/* Commission Structure */}
        <CommissionStructure />
        
        {/* Featured Products */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-bold text-gray-800">Featured Products</h2>
            <Link to="/products" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All Products
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
