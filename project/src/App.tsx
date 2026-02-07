import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { getOrCreateIdentity, Identity, mineProofOfWork } from './utils/crypto';
import { createRumor, createVerification, getRumors, getUserVerification, RumorWithTrust } from './api/rumors';
import { RumorCard } from './components/RumorCard';
import { PostRumor } from './components/PostRumor';
import { Sidebar } from './components/Sidebar';

type FilterType = 'all' | 'unverified' | 'verified';
type SortType = 'newest' | 'hottest' | 'oldest';

function App() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [rumors, setRumors] = useState<RumorWithTrust[]>([]);
  const [userVerifications, setUserVerifications] = useState<Map<string, 'verify' | 'dispute'>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const id = await getOrCreateIdentity();
      setIdentity(id);
      await loadRumors(id);
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRumors = async (id: Identity) => {
    const fetchedRumors = await getRumors();
    setRumors(fetchedRumors);

    const verifications = new Map<string, 'verify' | 'dispute'>();
    for (const rumor of fetchedRumors) {
      const verification = await getUserVerification(rumor.id, id.keyPair.publicKey);
      if (verification) {
        verifications.set(rumor.id, verification.verification_type);
      }
    }
    setUserVerifications(verifications);
  };

  const handlePostRumor = async (content: string, parentId?: string) => {
    if (!identity) return;

    const data = JSON.stringify({
      content,
      publicKey: identity.keyPair.publicKey,
      parentId: parentId || null,
      timestamp: Date.now()
    });

    const pow = await mineProofOfWork(data, 3);

    const rumor = await createRumor(
      content,
      identity.keyPair.publicKey,
      identity.userHandle,
      pow.hash,
      pow.nonce,
      parentId
    );

    if (rumor) {
      await loadRumors(identity);
    }
  };

  const handleVerify = async (rumorId: string, type: 'verify' | 'dispute') => {
    if (!identity) return;

    const data = JSON.stringify({
      rumorId,
      publicKey: identity.keyPair.publicKey,
      type,
      timestamp: Date.now()
    });

    const pow = await mineProofOfWork(data, 3);

    const verification = await createVerification(
      rumorId,
      identity.keyPair.publicKey,
      identity.userHandle,
      type,
      pow.hash,
      pow.nonce
    );

    if (verification) {
      await loadRumors(identity);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyToId(parentId);
    setIsPostOpen(true);
  };

  const getFilteredAndSortedRumors = () => {
    let filtered = rumors;

    if (filter === 'verified') {
      filtered = filtered.filter(r => (r.trust?.verify_count ?? 0) > 0);
    } else if (filter === 'unverified') {
      filtered = filtered.filter(r => (r.trust?.verify_count ?? 0) === 0);
    }

    return filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'hottest':
          return (b.trust?.trust_score ?? 0) - (a.trust?.trust_score ?? 0);
        default:
          return 0;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Generating anonymous identity...</p>
        </div>
      </div>
    );
  }

  const filteredRumors = getFilteredAndSortedRumors();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {identity && (
        <Sidebar
          userHandle={identity.userHandle}
          onNewPost={() => {
            setReplyToId(undefined);
            setIsPostOpen(true);
          }}
        />
      )}

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Minerva: Anonymous Campus Rumors</h1>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                🔥 Trending Campus Rumors
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <button
                  onClick={() => setFilter('all')}
                  className={`filter-link ${filter === 'all' ? 'filter-link-active' : ''}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unverified')}
                  className={`filter-link ${filter === 'unverified' ? 'filter-link-active' : ''}`}
                >
                  Unverified
                </button>
                <button
                  onClick={() => setFilter('verified')}
                  className={`filter-link ${filter === 'verified' ? 'filter-link-active' : ''}`}
                >
                  Verified
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="sort-button bg-transparent border-0 cursor-pointer focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="hottest">Hottest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {filteredRumors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  {rumors.length === 0
                    ? 'No rumors yet. Be the first to share one!'
                    : 'No rumors match your filters.'}
                </p>
              </div>
            ) : (
              filteredRumors.map((rumor) => (
                <RumorCard
                  key={rumor.id}
                  rumor={rumor}
                  userVerification={userVerifications.get(rumor.id) || null}
                  onVerify={handleVerify}
                  onReply={handleReply}
                />
              ))
            )}
          </div>
        </main>
      </div>

      <PostRumor
        isOpen={isPostOpen}
        onClose={() => {
          setIsPostOpen(false);
          setReplyToId(undefined);
        }}
        onSubmit={handlePostRumor}
        replyToId={replyToId}
        onCancelReply={() => setReplyToId(undefined)}
      />

      <button
        onClick={() => {
          setReplyToId(undefined);
          setIsPostOpen(true);
        }}
        className="fab-button"
        title="Submit New Rumor"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

export default App;
