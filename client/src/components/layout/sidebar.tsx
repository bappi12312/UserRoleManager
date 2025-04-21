import { User as UserType, UserRole } from "@shared/schema";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, copyToClipboard } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { X, ClipboardCopy } from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: UserType;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, user }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const { activateRoleMutation } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

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

  const handleUpgrade = () => {
    const nextRole = user.role === UserRole.USER 
      ? UserRole.ACTIVE_USER 
      : UserRole.AFFILIATOR;
      
    activateRoleMutation.mutate({
      userId: user.id,
      role: nextRole
    });
  };

  const isActive_user = user.role !== UserRole.USER;
  const isAffiliator = user.role === UserRole.AFFILIATOR;
  
  // Determine the upgrade button text based on current role
  const getUpgradeText = () => {
    if (user.role === UserRole.USER) {
      return "Upgrade for $100";
    } else if (user.role === UserRole.ACTIVE_USER) {
      return "Upgrade for $250";
    }
    return null; // No upgrade option for AFFILIATOR or ADMIN
  };

  const upgradeText = getUpgradeText();

  return (
    <aside 
      className={`lg:w-64 w-72 fixed inset-y-0 left-0 transform lg:relative lg:translate-x-0 transition duration-200 ease-in-out z-30 bg-white shadow-md ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between lg:hidden">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 8l-4 4-4-4" />
              <path d="M12 16V8" />
            </svg>
            <span className="font-heading font-semibold text-xl text-gray-800">ReferEarn</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex flex-col items-center">
            <Avatar className="w-16 h-16 mb-2">
              <AvatarFallback className="bg-primary-100 text-primary-700 text-xl">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-medium text-gray-800">{user.fullName}</h3>
            <span className="text-sm text-gray-500">
              {user.role === UserRole.USER && "Basic User"}
              {user.role === UserRole.ACTIVE_USER && "Active User"}
              {user.role === UserRole.AFFILIATOR && "Affiliator"}
              {user.role === UserRole.ADMIN && "Admin"}
            </span>
            
            <div className="mt-3 w-full">
              <div className="py-2 px-3 bg-gray-100 rounded-md flex items-center justify-between">
                <span className="text-xs text-gray-600">Your Referral Code:</span>
                <div className="flex items-center">
                  <span className="text-xs font-medium text-primary-700">{user.referralCode}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-5 w-5 p-0"
                    onClick={handleCopyReferralCode}
                    title="Copy Referral Code"
                  >
                    <ClipboardCopy className="h-3 w-3 text-gray-500" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">General</h3>
          </div>
          <Link href="/">
            <a className={`flex items-center px-3 py-2 mx-2 rounded-md ${
              isActive('/') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-dashboard-line mr-3 text-lg"></i>
              <span>Dashboard</span>
            </a>
          </Link>
          <Link href="/products">
            <a className={`flex items-center px-3 py-2 mx-2 mt-1 rounded-md ${
              isActive('/products') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-shopping-bag-line mr-3 text-lg"></i>
              <span>Products</span>
            </a>
          </Link>
          <Link href="/orders">
            <a className={`flex items-center px-3 py-2 mx-2 mt-1 rounded-md ${
              isActive('/orders') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-shopping-cart-line mr-3 text-lg"></i>
              <span>My Orders</span>
            </a>
          </Link>
          
          <div className="px-3 my-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Referral Program</h3>
          </div>
          <Link href="/referrals">
            <a className={`flex items-center px-3 py-2 mx-2 rounded-md ${
              isActive('/referrals') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-team-line mr-3 text-lg"></i>
              <span>My Network</span>
            </a>
          </Link>
          <Link href="/earnings">
            <a className={`flex items-center px-3 py-2 mx-2 mt-1 rounded-md ${
              isActive('/earnings') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-money-dollar-circle-line mr-3 text-lg"></i>
              <span>Earnings</span>
            </a>
          </Link>
          <Link href="/withdrawals">
            <a className={`flex items-center px-3 py-2 mx-2 mt-1 rounded-md ${
              isActive('/withdrawals') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-bank-card-line mr-3 text-lg"></i>
              <span>Withdrawals</span>
            </a>
          </Link>
          
          {user.role === UserRole.ADMIN && (
            <>
              <div className="px-3 my-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</h3>
              </div>
              <Link href="/admin">
                <a className={`flex items-center px-3 py-2 mx-2 rounded-md ${
                  isActive('/admin') && !isActive('/admin/users') && !isActive('/admin/products') 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="ri-dashboard-line mr-3 text-lg"></i>
                  <span>Admin Dashboard</span>
                </a>
              </Link>
              <Link href="/admin/users">
                <a className={`flex items-center px-3 py-2 mx-2 mt-1 rounded-md ${
                  isActive('/admin/users') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="ri-user-settings-line mr-3 text-lg"></i>
                  <span>Manage Users</span>
                </a>
              </Link>
              <Link href="/admin/products">
                <a className={`flex items-center px-3 py-2 mx-2 mt-1 rounded-md ${
                  isActive('/admin/products') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="ri-store-line mr-3 text-lg"></i>
                  <span>Manage Products</span>
                </a>
              </Link>
            </>
          )}
          
          <div className="border-t border-gray-200 my-4"></div>
          
          <Link href="/support">
            <a className={`flex items-center px-3 py-2 mx-2 mt-1 rounded-md ${
              isActive('/support') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-customer-service-line mr-3 text-lg"></i>
              <span>Support</span>
            </a>
          </Link>
          <Link href="/settings">
            <a className={`flex items-center px-3 py-2 mx-2 mt-1 rounded-md ${
              isActive('/settings') ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
            }`}>
              <i className="ri-settings-line mr-3 text-lg"></i>
              <span>Settings</span>
            </a>
          </Link>
        </nav>
        
        {/* Upgrade Account Banner - Only show if user is not already an Affiliator or Admin */}
        {upgradeText && (
          <div className="p-4 border-t">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg text-white">
              <h4 className="font-medium mb-1">
                {!isActive_user ? "Become an Active User" : "Upgrade to Affiliator"}
              </h4>
              <p className="text-xs text-white/80 mb-2">
                {!isActive_user 
                  ? "Start earning from referral commissions" 
                  : "Get commission on product sales"}
              </p>
              <Button 
                onClick={handleUpgrade} 
                className="w-full bg-white text-purple-600 font-medium py-1.5 rounded text-sm hover:bg-gray-100"
                disabled={activateRoleMutation.isPending}
              >
                {activateRoleMutation.isPending ? "Processing..." : upgradeText}
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
