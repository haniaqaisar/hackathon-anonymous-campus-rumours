import { Flame, Plus, Settings } from 'lucide-react';

interface SidebarProps {
  userHandle: string;
  onNewPost: () => void;
}

export function Sidebar({ userHandle, onNewPost }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 h-screen sticky top-0 flex flex-col">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
          <Flame className="w-5 h-5 text-orange-500" />
          Trending Rumors
        </h2>
      </div>

      <nav className="space-y-4 flex-1">
        <button
          onClick={onNewPost}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          New Post
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium">
          <Settings className="w-5 h-5" />
          <div className="text-left">
            <div>My Activity</div>
            <div className="text-xs text-gray-500">(Anonymous Profile)</div>
          </div>
        </button>
      </nav>

      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">Anonymous ID</div>
        <div className="text-sm font-mono text-gray-700 mt-1">{userHandle}</div>
      </div>
    </div>
  );
}
