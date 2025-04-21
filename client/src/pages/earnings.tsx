import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import AppLayout from "@/components/layout/app-layout";
import { Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, Users, ShoppingBag, Calendar, Search, Download, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export default function Earnings() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("all");
  const [transactionType, setTransactionType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch transactions data
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });
  
  // Filter transactions based on period, type, and search query
  const filteredTransactions = transactions.filter(transaction => {
    const matchesPeriod = () => {
      if (period === "all") return true;
      
      const transactionDate = new Date(transaction.createdAt);
      const now = new Date();
      
      if (period === "today") {
        return transactionDate.toDateString() === now.toDateString();
      } else if (period === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return transactionDate >= weekAgo;
      } else if (period === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return transactionDate >= monthAgo;
      } else if (period === "year") {
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return transactionDate >= yearAgo;
      }
      
      return true;
    };
    
    const matchesType = () => {
      if (transactionType === "all") return true;
      return transaction.type === transactionType;
    };
    
    const matchesSearch = () => {
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        transaction.description.toLowerCase().includes(query) ||
        transaction.type.toLowerCase().includes(query) ||
        transaction.id.toString().includes(query)
      );
    };
    
    return matchesPeriod() && matchesType() && matchesSearch();
  });
  
  // Calculate total earnings by transaction type
  const calculateTotalByType = (type: string) => {
    return transactions
      .filter(t => t.type === type)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };
  
  const totalReferralCommission = calculateTotalByType("REFERRAL_COMMISSION");
  const totalProductCommission = calculateTotalByType("PRODUCT_COMMISSION");
  const totalWithdrawals = calculateTotalByType("WITHDRAWAL");
  
  // Calculate net earnings
  const netEarnings = totalReferralCommission + totalProductCommission - totalWithdrawals;
  
  // Group transactions by date for the line chart
  const prepareChartData = () => {
    const chartData: { [key: string]: { date: string; amount: number } } = {};
    
    // Sort transactions by date
    const sortedTransactions = [...filteredTransactions]
      .filter(t => ["REFERRAL_COMMISSION", "PRODUCT_COMMISSION"].includes(t.type))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    sortedTransactions.forEach(transaction => {
      // Format date for display but use a standard format for object keys
      const dateObj = new Date(transaction.createdAt);
      const date = formatDate(dateObj);
      
      if (!chartData[date]) {
        chartData[date] = { date, amount: 0 };
      }
      
      chartData[date].amount += transaction.amount;
    });
    
    return Object.values(chartData);
  };
  
  // Prepare data for earnings by type
  const earningsByTypeData = [
    { name: "Referral Commissions", value: totalReferralCommission },
    { name: "Product Commissions", value: totalProductCommission },
  ];
  
  // Colors for the pie chart
  const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];
  
  // Get transaction badge color based on transaction type
  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "REFERRAL_COMMISSION":
        return (
          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
            Referral Commission
          </Badge>
        );
      case "PRODUCT_COMMISSION":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            Product Commission
          </Badge>
        );
      case "WITHDRAWAL":
        return (
          <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">
            Withdrawal
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {type}
          </Badge>
        );
    }
  };
  
  // Export transactions to CSV
  const exportToCSV = () => {
    const headers = ["ID", "Date", "Type", "Description", "Amount"];
    
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => {
        return [
          t.id,
          formatDate(new Date(t.createdAt)),
          t.type,
          `"${t.description.replace(/"/g, '""')}"`,
          t.amount
        ].join(",");
      })
    ].join("\\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `earnings_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">Earnings</h1>
          <p className="text-gray-600">Track, analyze, and manage your commission earnings</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-success-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-600">
                {formatCurrency(totalReferralCommission + totalProductCommission)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lifetime earnings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Referral Earnings</CardTitle>
              <Users className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(totalReferralCommission)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                From your referred users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Product Earnings</CardTitle>
              <ShoppingBag className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(totalProductCommission)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                From product sales
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Available Balance</CardTitle>
              <Calendar className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(netEarnings)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Earnings Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Earnings Over Time</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={prepareChartData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Earnings']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          name="Earnings"
                          stroke="#4F46E5"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Earnings by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Earnings by Type</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={earningsByTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {earningsByTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Monthly Earnings Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareChartData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="amount" name="Earnings" fill="#4F46E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={transactionType} onValueChange={setTransactionType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="REFERRAL_COMMISSION">Referral Commission</SelectItem>
                        <SelectItem value="PRODUCT_COMMISSION">Product Commission</SelectItem>
                        <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" onClick={exportToCSV}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                
                {filteredTransactions.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">#{transaction.id}</TableCell>
                            <TableCell>{formatDate(transaction.createdAt ? new Date(transaction.createdAt) : null)}</TableCell>
                            <TableCell>{getTransactionBadge(transaction.type)}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell className={`text-right font-medium ${
                              transaction.type === "WITHDRAWAL" ? "text-rose-600" : "text-success-600"
                            }`}>
                              {transaction.type === "WITHDRAWAL" ? "-" : "+"}{formatCurrency(transaction.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-md border border-gray-100">
                    <Filter className="h-10 w-10 text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium text-gray-700">No transactions found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search query</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}