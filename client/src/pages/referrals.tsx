import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { copyToClipboard, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCcw, Search, ClipboardCopy, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export default function Referrals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Fetch referrals
  const { data: referrals = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/referrals'],
    enabled: !!user,
  });

  // Fetch transactions to calculate earnings
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
    enabled: !!user,
  });
  
  // Filter referrals based on search term and role
  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = 
      referral.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || referral.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Get earnings per referral (in a real implementation, this would come from the backend)
  const getReferralEarnings = (referralId: number) => {
    return transactions
      .filter(t => 
        t.relatedUserId === referralId && 
        ["REFERRAL_COMMISSION", "PRODUCT_COMMISSION"].includes(t.type)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };
  
  // Calculate total earnings from referrals
  const totalReferralEarnings = transactions
    .filter(t => ["REFERRAL_COMMISSION", "PRODUCT_COMMISSION"].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDirectReferrals = referrals.length;
  const totalActiveReferrals = referrals.filter(r => r.role !== "USER").length;
  
  const handleCopyReferralCode = async () => {
    if (!user) return;
    
    const success = await copyToClipboard(user.referralCode);
    if (success) {
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    } else {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };
  
  const handleShareReferralLink = async () => {
    if (!user) return;
    
    // Generate referral link - in a real app this would be a proper URL to your site
    const referralLink = `https://referearn.app/register?ref=${user.referralCode}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join ReferEarn',
          text: 'Join ReferEarn using my referral code and start earning!',
          url: referralLink,
        });
      } else {
        // Fallback to copying the link
        const success = await copyToClipboard(referralLink);
        if (success) {
          toast({
            title: "Copied!",
            description: "Referral link copied to clipboard",
          });
        } else {
          throw new Error("Failed to copy");
        }
      }
    } catch (error) {
      toast({
        title: "Sharing failed",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ACTIVE_USER":
        return (
          <Badge className="px-2 py-1 bg-primary-100 hover:bg-primary-100 text-primary-800 rounded-full">
            Active User
          </Badge>
        );
      case "AFFILIATOR":
        return (
          <Badge className="px-2 py-1 bg-purple-100 hover:bg-purple-100 text-purple-800 rounded-full">
            Affiliator
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge className="px-2 py-1 bg-red-100 hover:bg-red-100 text-red-800 rounded-full">
            Admin
          </Badge>
        );
      default:
        return (
          <Badge className="px-2 py-1 bg-gray-100 hover:bg-gray-100 text-gray-800 rounded-full">
            Basic User
          </Badge>
        );
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">My Network</h1>
          <p className="text-gray-600">Manage your referrals and track your network growth</p>
        </div>
        
        {/* Referral Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Direct Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{totalDirectReferrals}</div>
              <p className="text-sm text-gray-500 mt-1">People who used your referral code</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-600">{totalActiveReferrals}</div>
              <p className="text-sm text-gray-500 mt-1">Referrals who upgraded their account</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Earnings from Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-600">${totalReferralEarnings.toFixed(2)}</div>
              <p className="text-sm text-gray-500 mt-1">Commissions earned from your network</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Referral Link Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="font-bold text-gray-800 mb-4">Share Your Referral Link</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                value={user?.referralCode || ""}
                readOnly
                className="pr-24 text-base"
                placeholder="Your referral code"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1 h-8"
                onClick={handleCopyReferralCode}
              >
                <ClipboardCopy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            
            <Button
              onClick={handleShareReferralLink}
              className="bg-primary-500 hover:bg-primary-600"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral Link
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Share your referral code with others to earn commissions when they register and upgrade their accounts.
            You'll earn 20% when they become Active Users ($20) or Affiliators ($50).
          </p>
        </div>
        
        {/* Referrals List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search referrals..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-1/4">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="USER">Basic Users</SelectItem>
                    <SelectItem value="ACTIVE_USER">Active Users</SelectItem>
                    <SelectItem value="AFFILIATOR">Affiliators</SelectItem>
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
          ) : filteredReferrals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Earnings Generated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferrals.map(referral => {
                    const earnings = getReferralEarnings(referral.id);
                    
                    return (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                {getInitials(referral.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{referral.fullName}</p>
                              <p className="text-xs text-gray-500">{referral.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(referral.createdAt)}
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(referral.role)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-success-600">
                          ${earnings.toFixed(2)}
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
                <i className="ri-user-add-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">No Referrals Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {searchTerm || roleFilter !== "all" 
                  ? "Try adjusting your search filters to find your referrals." 
                  : "You don't have any referrals yet. Share your referral code to start building your network."}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}