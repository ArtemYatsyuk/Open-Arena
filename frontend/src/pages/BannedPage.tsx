import { useNavigate } from 'react-router-dom';

export default function BannedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-bg-primary">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">⛔</div>
        <h1 className="text-2xl font-medium mb-2">Account Banned</h1>
        <p className="text-text-secondary mb-6">
          Your account has been suspended. Please contact support if you believe this is an error.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-accent text-white rounded-pill text-sm font-medium hover:bg-accent-hover transition"
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
