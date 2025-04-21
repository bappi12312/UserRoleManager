import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Transaction, Order, UserRole } from "@shared/schema";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  // Fetch all data required for the dashboard
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Loading state
  const isLoading = usersLoading || transactionsLoading || productsLoading;

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.role === UserRole.ACTIVE_USER).length;
  const affiliators = users.filter(user => user.role === UserRole.AFFILIATOR).length;
  
  const totalActivationFees = transactions
    .filter(t => t.type === "ACTIVATION_FEE")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const totalCommissions = transactions
    .filter(t => ["REFERRAL_COMMISSION", "PRODUCT_COMMISSION"].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  // Prepare data for charts
  const userRoleData = [
    { name: "Basic Users", value: totalUsers - activeUsers - affiliators },
    { name: "Active Users", value: activeUsers },
    { name: "Affiliators", value: affiliators },
  ];

  const transactionTypeData = [
    { 
      name: "Activation Fees", 
      value: transactions.filter(t => t.type === "ACTIVATION_FEE").reduce((sum, t) => sum + Math.abs(t.amount), 0)
    },
    { 
      name: "Referral Commissions", 
      value: transactions.filter(t => t.type === "REFERRAL_COMMISSION").reduce((sum, t) => sum + t.amount, 0)
    },
    { 
      name: "Product Commissions", 
      value: transactions.filter(t => t.type === "PRODUCT_COMMISSION").reduce((sum, t) => sum + t.amount, 0)
    },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your platform statistics</p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Users</p>
                      <p className="text-2xl font-semibold text-gray-800">{totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.2 7.8l-7.7 7.7-4-4-5.7 5.7"></path>
                        <path d="M15 7h6v6"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Affiliators</p>
                      <p className="text-2xl font-semibold text-gray-800">{affiliators}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Products</p>
                      <p className="text-2xl font-semibold text-gray-800">{products.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-800">{formatCurrency(totalActivationFees)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userRoleData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}`, 'Users']} />
                        <Bar dataKey="value" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={transactionTypeData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(value as number), 'Amount']} />
                        <Bar dataKey="value" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Platform Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium mb-2">User Activity</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-600">Total Users:</span>
                        <span className="font-medium">{totalUsers}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Basic Users:</span>
                        <span className="font-medium">{totalUsers - activeUsers - affiliators}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Active Users:</span>
                        <span className="font-medium">{activeUsers}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Affiliators:</span>
                        <span className="font-medium">{affiliators}</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium mb-2">Revenue Summary</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-600">Activation Fees:</span>
                        <span className="font-medium">{formatCurrency(totalActivationFees)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Total Commissions Paid:</span>
                        <span className="font-medium">{formatCurrency(totalCommissions)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Net Revenue:</span>
                        <span className="font-medium">{formatCurrency(totalActivationFees - totalCommissions)}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
