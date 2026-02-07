import { useState } from 'react';
import { CheckCircle, XCircle, MessageCircle, Loader2, Flag } from 'lucide-react';
import { RumorWithTrust } from '../api/rumors';

interface RumorCardProps {
  rumor: RumorWithTrust;
  userVerification: 'verify' | 'dispute' | null;
  onVerify: (rumorId: string, type: 'verify' | 'dispute') => Promise<void>;
  onReply: (parentId: string) => void;
}

export function RumorCard({ rumor, userVerification, onVerify, onReply }: RumorCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const trustPercentage = rumor.trust?.trust_percentage ?? 50;
  const verifyCount = rumor.trust?.verify_count ?? 0;
  const disputeCount = rumor.trust?.dispute_count ?? 0;

  const getTrustBadgeClass = (percentage: number): string => {
    if (percentage >= 70) return 'trust-high';
    if (percentage >= 40) return 'trust-medium';
    return 'trust-low';
  };

  const getCardBorderClass = (percentage: number): string => {
    if (percentage >= 70) return 'rumor-card-high';
    if (percentage >= 40) return 'rumor-card-medium';
    return 'rumor-card-low';
  };

  const handleVerify = async (type: 'verify' | 'dispute') => {
    if (userVerification || isVerifying) return;

    setIsVerifying(true);
    try {
      await onVerify(rumor.id, type);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${getCardBorderClass(trustPercentage)}`}>
      <h3 className="text-lg font-semibold text-blue-600 mb-3">{rumor.content}</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <span className={`trust-score-badge ${getTrustBadgeClass(trustPercentage)}`}>
            Trust Score: {trustPercentage.toFixed(0)}%
          </span>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Comments: {rumor.children_count || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Verifications: {verifyCount}</span>
            </div>
            {disputeCount > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span className="text-sm">{disputeCount}</span>
              </div>
            )}
          </div>
        </div>

        {trustPercentage < 50 && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded">
            <Flag className="w-4 h-4" />
            High Anomaly Alert
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => handleVerify('verify')}
          disabled={!!userVerification || isVerifying}
          className={`px-4 py-2 rounded font-semibold flex items-center gap-2 text-sm transition-all ${
            userVerification === 'verify'
              ? 'bg-green-500 text-white'
              : userVerification
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isVerifying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          Verify {userVerification === 'verify' ? '(Yours)' : ''}
        </button>

        <button
          onClick={() => handleVerify('dispute')}
          disabled={!!userVerification || isVerifying}
          className={`px-4 py-2 rounded font-semibold flex items-center gap-2 text-sm transition-all ${
            userVerification === 'dispute'
              ? 'bg-red-500 text-white'
              : userVerification
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {isVerifying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          Dispute {userVerification === 'dispute' ? '(Yours)' : ''}
        </button>
      </div>

      {rumor.parent_id && (
        <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
          Based on: [Parent Rumor] (Score Pruned)
        </div>
      )}
<button
  onClick={() => onReply(rumor.id)}
  className="px-4 py-2 rounded font-semibold flex items-center gap-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
>
  <MessageCircle className="w-4 h-4" />
  Comment
</button>
    </div>
  );
}
