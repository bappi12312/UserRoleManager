import { User, UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface AccountStatusProps {
  currentUser: User | null;
}

export default function AccountStatus({ currentUser }: AccountStatusProps) {
  const { activateRoleMutation } = useAuth();

  if (!currentUser) return null;

  const handleActivateUser = () => {
    activateRoleMutation.mutate({
      userId: currentUser.id,
      role: UserRole.ACTIVE_USER
    });
  };

  const handleActivateAffiliator = () => {
    activateRoleMutation.mutate({
      userId: currentUser.id,
      role: UserRole.AFFILIATOR
    });
  };

  const isBasicUser = currentUser.role === UserRole.USER;
  const isActiveUser = currentUser.role === UserRole.ACTIVE_USER;
  const isAffiliator = currentUser.role === UserRole.AFFILIATOR;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-heading font-bold text-gray-800 mb-4">Account Status</h2>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">
                Current Role: {" "}
                <span className={`
                  ${isBasicUser ? "text-gray-600" : ""}
                  ${isActiveUser ? "text-primary-600" : ""}
                  ${isAffiliator ? "text-purple-600" : ""}
                  ${isAdmin ? "text-red-600" : ""}
                `}>
                  {isBasicUser && "Basic User"}
                  {isActiveUser && "Active User"}
                  {isAffiliator && "Affiliator User"}
                  {isAdmin && "Admin"}
                </span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isBasicUser && "Upgrade your account to start earning with referrals"}
                {isActiveUser && "You have access to referral commission benefits"}
                {isAffiliator && "You can earn commissions on both referrals and product sales"}
                {isAdmin && "You have full administrative access to the platform"}
              </p>
            </div>
            <div className="hidden sm:block">
              {!isBasicUser && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  <i className="ri-check-line mr-1"></i> Activated
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex-1 mb-4 sm:mb-0">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <i className="ri-user-line text-lg text-gray-500"></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Basic User</h4>
                  <p className="text-sm text-gray-600">Default account type</p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <i className="ri-check-line mr-1"></i> Completed
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex-1 mb-4 sm:mb-0">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${
                  isActiveUser || isAffiliator || isAdmin ? "bg-primary-100" : "bg-gray-100"
                } flex items-center justify-center mr-3`}>
                  <i className={`ri-user-star-line text-lg ${
                    isActiveUser || isAffiliator || isAdmin ? "text-primary-500" : "text-gray-500"
                  }`}></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Active User</h4>
                  <p className="text-sm text-gray-600">Earn from referrals with a multi-level commission structure</p>
                </div>
              </div>
            </div>
            {isActiveUser || isAffiliator || isAdmin ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                <i className="ri-check-line mr-1"></i> Activated
              </span>
            ) : (
              <Button 
                onClick={handleActivateUser}
                className="px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition"
                disabled={activateRoleMutation.isPending}
              >
                {activateRoleMutation.isPending ? "Processing..." : "Upgrade for $100"}
              </Button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex-1 mb-4 sm:mb-0">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${
                  isAffiliator || isAdmin ? "bg-purple-100" : "bg-gray-100"
                } flex items-center justify-center mr-3`}>
                  <i className={`ri-store-line text-lg ${
                    isAffiliator || isAdmin ? "text-purple-500" : "text-gray-500"
                  }`}></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Affiliator User</h4>
                  <p className="text-sm text-gray-600">Earn commissions from product sales</p>
                </div>
              </div>
            </div>
            {isAffiliator || isAdmin ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <i className="ri-check-line mr-1"></i> Activated
              </span>
            ) : (
              <Button 
                onClick={handleActivateAffiliator}
                className={`px-4 py-2 rounded-md ${
                  !isActiveUser 
                    ? "bg-gray-300 cursor-not-allowed" 
                    : "bg-purple-500 hover:bg-purple-600"
                } text-white text-sm font-medium transition`}
                disabled={!isActiveUser || activateRoleMutation.isPending}
                title={!isActiveUser ? "Become an Active User first" : ""}
              >
                {activateRoleMutation.isPending ? "Processing..." : "Upgrade for $250"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
