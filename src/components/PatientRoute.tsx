import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const PatientRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading, isPatient, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isPatient && !isAdmin) return <Navigate to="/app" replace />;
  return children;
};

export default PatientRoute;