import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface RecentReferralsProps {
  referrals: User[];
}

export default function RecentReferrals({ referrals }: RecentReferralsProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ACTIVE_USER":
        return (
          <Badge className="px-2 py-1 bg-green-100 hover:bg-green-100 text-green-800 rounded-full">
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

  // Mock commission data (would come from transactions in a real implementation)
  const getCommission = (role: string) => {
    switch (role) {
      case "ACTIVE_USER":
        return "$20.00";
      case "AFFILIATOR":
        return "$50.00";
      default:
        return "$0.00";
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-gray-800">Recent Referrals</h2>
        <Link href="/referrals" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {referrals.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Joined</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referrals.map(referral => (
                    <tr key={referral.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(referral.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(referral.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-success-600">
                        {getCommission(referral.role)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {referrals.length > 3 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Showing {Math.min(referrals.length, 3)} of {referrals.length} referrals</p>
                  <div className="flex items-center space-x-1">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 min-w-8 px-3 bg-gray-50 border-primary-200 text-gray-700 font-medium">1</Button>
                    <Button variant="ghost" size="sm" className="h-8 min-w-8 px-3 text-gray-600">2</Button>
                    <Button variant="ghost" size="sm" className="h-8 min-w-8 px-3 text-gray-600">3</Button>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <i className="ri-user-add-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No Referrals Yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Share your referral code with others to start building your network and earning commissions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
