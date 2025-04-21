import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCcw, ArrowDownToLine } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Transaction } from "@shared/schema";

export default function Withdrawals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bkash");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fetch user transactions
  const { 
    data: transactions = [], 
    isLoading, 
    refetch 
  } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });
  
  // Filter for deposit transactions (positive amount)
  const positiveTransactions = transactions.filter(t => t.amount > 0);
  
  // Filter for withdrawal transactions (negative amount)
  const withdrawalTransactions = transactions.filter(t => t.amount < 0 && t.type === "WITHDRAWAL");
  
  // Calculate available balance
  const availableBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  
  const withdrawalMutation = useMutation({
    mutationFn: async (data: { amount: number, paymentMethod: string, accountNumber: string }) => {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setAmount("");
      setAccountNumber("");
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "There was an error processing your withdrawal request",
        variant: "destructive",
      });
    },
  });
  
  const handleWithdrawal = () => {
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    if (parsedAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Your withdrawal amount exceeds your available balance",
        variant: "destructive",
      });
      return;
    }
    
    if (!accountNumber) {
      toast({
        title: "Missing Account Information",
        description: "Please enter your account number",
        variant: "destructive",
      });
      return;
    }
    
    withdrawalMutation.mutate({
      amount: parsedAmount,
      paymentMethod,
      accountNumber
    });
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">Withdrawals</h1>
          <p className="text-gray-600">Manage your earnings and withdraw commissions</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(availableBalance)}</div>
              <p className="text-sm text-gray-500 mt-1">Total earnings available for withdrawal</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-600">
                {formatCurrency(positiveTransactions.reduce((sum, t) => sum + t.amount, 0))}
              </div>
              <p className="text-sm text-gray-500 mt-1">Cumulative earnings from all sources</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Withdrawn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {formatCurrency(Math.abs(withdrawalTransactions.reduce((sum, t) => sum + t.amount, 0)))}
              </div>
              <p className="text-sm text-gray-500 mt-1">Amount you've withdrawn to date</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">Withdrawal History</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <ArrowDownToLine className="h-4 w-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                      Enter the amount you want to withdraw and your payment details.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount" className="text-right">
                        Amount
                      </Label>
                      <div className="col-span-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <Input
                            id="amount"
                            placeholder="0.00"
                            type="number"
                            className="pl-7"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Available balance: {formatCurrency(availableBalance)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="payment-method" className="text-right">
                        Method
                      </Label>
                      <select
                        id="payment-method"
                        className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="bkash">Bkash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="paypal">PayPal</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="account" className="text-right">
                        Account
                      </Label>
                      <Input
                        id="account"
                        placeholder="Enter your account number"
                        className="col-span-3"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      onClick={handleWithdrawal}
                      disabled={withdrawalMutation.isPending}
                    >
                      {withdrawalMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : "Confirm Withdrawal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
          ) : withdrawalTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawalTransactions.map((transaction) => {
                    // In a real implementation, this would come from the transaction data
                    // Here we're parsing it from the description for demo purposes
                    const parts = transaction.description.split(' via ');
                    const method = parts.length > 1 ? parts[1].split(' ')[0] : 'Bkash';
                    const accountMatch = transaction.description.match(/\(([^)]+)\)/);
                    const account = accountMatch ? accountMatch[1] : 'N/A';
                    const status = "Completed";
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Math.abs(transaction.amount))}
                        </TableCell>
                        <TableCell>{method}</TableCell>
                        <TableCell>{account}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {status}
                          </span>
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
                <i className="ri-exchange-dollar-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No Withdrawals Yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                You haven't made any withdrawals yet. Use the "Withdraw Funds" button to request a withdrawal.
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">Earning Breakdown</h2>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
          ) : positiveTransactions.length > 0 ? (
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
                  {positiveTransactions.map((transaction) => {
                    // Format transaction type for display
                    let type = "";
                    let typeClass = "";
                    
                    switch(transaction.type) {
                      case "REFERRAL_COMMISSION":
                        type = "Referral Commission";
                        typeClass = "bg-primary-100 text-primary-800";
                        break;
                      case "PRODUCT_COMMISSION":
                        type = "Product Commission";
                        typeClass = "bg-purple-100 text-purple-800";
                        break;
                      default:
                        type = transaction.type;
                        typeClass = "bg-gray-100 text-gray-800";
                    }
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeClass}`}>
                            {type}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-success-600 font-medium">
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
                <i className="ri-wallet-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No Earnings Yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Your earnings will appear here once you've received commissions from referrals or product sales.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}