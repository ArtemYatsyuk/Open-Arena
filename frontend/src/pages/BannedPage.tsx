import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BannedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Account Banned</h1>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
          Your account has been suspended. Please contact support if you believe this is an error.
        </p>
        <Button onClick={() => navigate('/login')} className="w-full" size="lg">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Button>
      </div>
    </div>
  );
}
