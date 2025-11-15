import { useAuth } from '@/hooks/use-auth';
import { UserPersonalInfo } from '@/components/profile/UserPersonalInfo';
import { Navigate } from 'react-router-dom';

export default function UserPersonalInfoPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <UserPersonalInfo userId={user.id} />;
}
