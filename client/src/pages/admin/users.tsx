import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/app-layout";
import { User, UserRole } from "@shared/schema";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  RefreshCcw,
  UserCheck,
  Users,
  Store
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return { variant: "destructive", label: "Admin" };
      case UserRole.AFFILIATOR:
        return { variant: "purple", label: "Affiliator" };
      case UserRole.ACTIVE_USER:
        return { variant: "default", label: "Active User" };
      default:
        return { variant: "secondary", label: "Basic User" };
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">User Management</h1>
          <p className="text-gray-600">View and manage all users on the platform</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search users..." 
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
                    <SelectItem value={UserRole.USER}>Basic Users</SelectItem>
                    <SelectItem value={UserRole.ACTIVE_USER}>Active Users</SelectItem>
                    <SelectItem value={UserRole.AFFILIATOR}>Affiliators</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>Admins</SelectItem>
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
          ) : paginatedUsers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Referral Code</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map(user => {
                      const roleBadge = getRoleBadgeVariant(user.role);
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-9 w-9 mr-3">
                                <AvatarFallback className="bg-primary-100 text-primary-700">
                                  {getInitials(user.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-700">{user.fullName}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={roleBadge.variant as any} 
                              className={user.role === UserRole.AFFILIATOR ? "bg-purple-500" : ""}
                            >
                              {roleBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.referralCode}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Users className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {user.role === UserRole.USER && (
                                <Button variant="default" size="sm" className="bg-primary-500">
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Activate
                                </Button>
                              )}
                              {user.role === UserRole.ACTIVE_USER && (
                                <Button variant="default" size="sm" className="bg-purple-500">
                                  <Store className="h-4 w-4 mr-1" />
                                  Affiliator
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-gray-700">No users found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search filters</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
