import { useState } from "react";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials, copyToClipboard } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  User as UserIcon,
  DollarSign,
  Users,
  Settings,
  LogOut,
  ClipboardCopy,
  ChevronDown
} from "lucide-react";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: User;
}

export default function Header({ sidebarOpen, setSidebarOpen, user }: HeaderProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopyReferralCode = async () => {
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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="mr-2 text-gray-600 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8l-4 4-4-4" />
              <path d="M12 16V8" />
            </svg>
            <span className="font-heading font-semibold text-xl text-gray-800">ReferEarn</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
            <span className="text-sm text-gray-700">Your Referral Code:</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-primary-700">{user.referralCode}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-1 h-6 w-6 p-0" 
                onClick={handleCopyReferralCode}
                title="Copy Referral Code"
              >
                <ClipboardCopy className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>
          
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-1 focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-sm">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium text-gray-700">
                  {user.fullName}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/earnings" className="flex items-center">
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>My Earnings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/referrals" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  <span>My Network</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
