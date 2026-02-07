import { useState, useRef } from 'react';
import { Send, Loader2, X, Paperclip, FileText, Film, Image as ImageIcon } from 'lucide-react';

interface PostRumorProps {
  onSubmit: (content: string, parentId?: string, file?: File | null) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  replyToId?: string;
  onCancelReply?: () => void;
}

export function PostRumor({ onSubmit, onClose, isOpen, replyToId, onCancelReply }: PostRumorProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim().length < 10) {
      alert('Rumor must be at least 10 characters long');
      return;
    }

    if (content.length > 5000) {
      alert('Rumor must be less than 5000 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Pass the selected file to your onSubmit function
      await onSubmit(content, replyToId, selectedFile);
      setContent('');
      setSelectedFile(null);
      onClose();
      if (onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error('Error submitting rumor:', error);
      alert('Failed to submit rumor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Limit file size to 10MB for the hackathon
      if (file.size > 10 * 1024 * 1024) {
        alert('File is too large. Max size is 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {replyToId ? 'Add Comment' : 'Submit New Rumor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {replyToId && (
          <div className="mb-3 pb-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">Replying to rumor...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an anonymous rumor... (min 10 characters)"
            className="w-full bg-gray-50 text-gray-900 border border-gray-300 rounded-lg p-4 mb-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
            rows={5}
            disabled={isSubmitting}
            autoFocus
          />

          {/* File Upload Section */}
          <div className="mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*,application/pdf"
              className="hidden"
            />
            
            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Paperclip className="w-4 h-4" />
                Attach Image, Video, or PDF
              </button>
            ) : (
              <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-sm text-blue-700 truncate">
                  {selectedFile.type.startsWith('image/') && <ImageIcon className="w-4 h-4" />}
                  {selectedFile.type.startsWith('video/') && <Film className="w-4 h-4" />}
                  {selectedFile.type === 'application/pdf' && <FileText className="w-4 h-4" />}
                  <span className="truncate">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">
              {content.length}/5000 characters
            </span>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || content.trim().length < 10}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {replyToId ? 'Post Comment' : 'Post Rumor'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}