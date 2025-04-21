import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { UserRole } from "@shared/schema";

export function ProtectedRoute({
  component: Component,
  adminOnly = false
}: {
  component: () => React.JSX.Element;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (adminOnly && user.role !== UserRole.ADMIN) {
    return <Redirect to="/" />;
  }

  return <Component />;
}
