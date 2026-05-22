import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function BannedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-bg-primary animate-fadeIn">
      <div className="text-center max-w-sm p-8">
        <div className="w-20 h-20 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-danger" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Account Banned</h1>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed">
          Your account has been suspended. Please contact support if you believe this is an error.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      </div>
    </div>
  );
}
