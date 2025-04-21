import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Product, Order } from "@shared/schema";
import AppLayout from "@/components/layout/app-layout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, RefreshCcw, ArrowUpRight, DownloadIcon } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// We need to extend the Order type with product details for display
interface OrderWithProduct extends Order {
  product?: Product;
}

export default function Orders() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: !!user,
  });
  
  // Fetch products to get product details
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Combine orders with product details
  const ordersWithProducts: OrderWithProduct[] = orders.map(order => {
    const product = products.find(p => p.id === order.productId);
    return { ...order, product };
  });
  
  // Filter orders based on status
  const filteredOrders = statusFilter === "all" 
    ? ordersWithProducts 
    : ordersWithProducts.filter(order => order.status === statusFilter);
    
  // Calculate total spent
  const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);
  
  // Get order count
  const orderCount = orders.length;
  
  const isLoading = ordersLoading || productsLoading;
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">My Orders</h1>
          <p className="text-gray-600">View and manage your purchase history</p>
        </div>
        
        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{orderCount}</div>
              <p className="text-sm text-gray-500 mt-1">Number of purchases made</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(totalSpent)}</div>
              <p className="text-sm text-gray-500 mt-1">Amount spent on products</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Latest Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <>
                  <div className="text-lg font-medium text-gray-800">
                    {formatDate(orders[0].createdAt)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {products.find(p => p.id === orders[0].productId)?.name || "Unknown product"}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-lg font-medium text-gray-800">N/A</div>
                  <p className="text-sm text-gray-500 mt-1">No purchases yet</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="w-full md:w-1/4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="outline" 
                className="ml-auto"
                onClick={() => refetch()}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const statusVariant = order.status === "COMPLETED" 
                      ? "bg-green-100 text-green-800" 
                      : order.status === "PROCESSING" 
                        ? "bg-amber-100 text-amber-800" 
                        : "bg-red-100 text-red-800";
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {order.product && (
                              <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden mr-3">
                                <img 
                                  src={order.product.imageUrl} 
                                  alt={order.product.name} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-800">
                                {order.product?.name || "Unknown product"}
                              </p>
                              {order.referralCode && (
                                <p className="text-xs text-gray-500">
                                  Referral: {order.referralCode}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(order.amount)}</TableCell>
                        <TableCell>
                          <Badge className={`px-2 py-1 rounded-full ${statusVariant}`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/products/${order.productId}`}>
                              <Button variant="ghost" size="sm">
                                <ArrowUpRight className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm">
                              <DownloadIcon className="h-4 w-4 mr-1" />
                              Receipt
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <i className="ri-shopping-cart-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No Orders Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {statusFilter !== "all" 
                  ? "Try adjusting your filters to see more orders." 
                  : "You haven't made any purchases yet."}
              </p>
              <Link href="/products">
                <Button className="mt-4">Browse Products</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}