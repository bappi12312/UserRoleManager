import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@shared/schema";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function Earnings() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("all");
  const [transactionType, setTransactionType] = useState("all");
  
  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });
  
  // Get only positive transactions (earnings)
  const earningsTransactions = transactions.filter(t => t.amount > 0);
  
  // Filter based on period
  const getFilteredTransactions = () => {
    let filtered = [...earningsTransactions];
    
    // Filter by time period
    if (period !== "all") {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.createdAt) >= startDate);
    }
    
    // Filter by transaction type
    if (transactionType !== "all") {
      filtered = filtered.filter(t => t.type === transactionType);
    }
    
    return filtered;
  };
  
  const filteredTransactions = getFilteredTransactions();
  
  // Calculate total earnings
  const totalEarnings = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate earnings by type
  const referralEarnings = filteredTransactions
    .filter(t => t.type === "REFERRAL_COMMISSION")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const productEarnings = filteredTransactions
    .filter(t => t.type === "PRODUCT_COMMISSION")
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate earnings by time
  const getTimeSeriesData = () => {
    // Group transactions by month
    const monthlyEarnings: Record<string, number> = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.createdAt);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyEarnings[monthYear]) {
        monthlyEarnings[monthYear] = 0;
      }
      
      monthlyEarnings[monthYear] += t.amount;
    });
    
    // Convert to array and sort by date
    return Object.entries(monthlyEarnings)
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month - 1);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          earnings: value
        };
      })
      .sort((a, b) => {
        return new Date(a.month).getTime() - new Date(b.month).getTime();
      });
  };
  
  // Prepare data for pie chart
  const pieChartData = [
    { name: 'Referral Commissions', value: referralEarnings },
    { name: 'Product Commissions', value: productEarnings },
  ];
  
  const COLORS = ['#3B82F6', '#8B5CF6'];
  
  // Get time series data
  const timeSeriesData = getTimeSeriesData();
  
  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "REFERRAL_COMMISSION":
        return "Referral Commission";
      case "PRODUCT_COMMISSION":
        return "Product Commission";
      default:
        return type;
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">My Earnings</h1>
          <p className="text-gray-600">Track and analyze your earnings from referrals and product sales</p>
        </div>
        
        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(totalEarnings)}</div>
              <p className="text-sm text-gray-500 mt-1">
                {period === "all" ? "Lifetime earnings" : `Earnings in the selected period`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Referral Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-600">{formatCurrency(referralEarnings)}</div>
              <p className="text-sm text-gray-500 mt-1">
                {((referralEarnings / totalEarnings) * 100 || 0).toFixed(1)}% of total earnings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Product Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(productEarnings)}</div>
              <p className="text-sm text-gray-500 mt-1">
                {((productEarnings / totalEarnings) * 100 || 0).toFixed(1)}% of total earnings
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Time Period</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-1/4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Commission Type</label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="REFERRAL_COMMISSION">Referral Commissions</SelectItem>
                  <SelectItem value="PRODUCT_COMMISSION">Product Commissions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
          </div>
        ) : (
          <Tabs defaultValue="transactions" className="mb-6">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="charts">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {filteredTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => {
                          const type = transaction.type;
                          let typeClass = "";
                          
                          switch(type) {
                            case "REFERRAL_COMMISSION":
                              typeClass = "bg-primary-100 text-primary-800";
                              break;
                            case "PRODUCT_COMMISSION":
                              typeClass = "bg-purple-100 text-purple-800";
                              break;
                            default:
                              typeClass = "bg-gray-100 text-gray-800";
                          }
                          
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                              <TableCell>
                                <Badge className={`px-2 py-1 rounded-full ${typeClass}`}>
                                  {getTransactionTypeLabel(type)}
                                </Badge>
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell className="font-medium text-success-600">
                                +{formatCurrency(transaction.amount)}
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
                      <i className="ri-coins-line text-2xl text-gray-400"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-1">No Earnings Found</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      {period !== "all" || transactionType !== "all"
                        ? "Try adjusting your filters to see more results."
                        : "You haven't earned any commissions yet. Refer users or sell products to start earning."}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="charts">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {pieChartData.some(d => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          No earnings data to display
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {timeSeriesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={timeSeriesData}
                            margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" angle={-45} textAnchor="end" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Bar dataKey="earnings" fill="#3B82F6" name="Earnings" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                          No earnings history to display
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}