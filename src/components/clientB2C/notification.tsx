import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';

interface User {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null; 
}

const SendNotificationModal = ({ isOpen, onClose, user }: Props) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sending notification to:", user);
    console.log("Title:", title);
    console.log("Message:", message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1f2937]">Send Notification</h2>
            <p className="mt-1 text-sm text-gray-500">
              Send a notification to{' '}
              <span className="font-medium">
                {user ? user.username || `${user.firstName || ''} ${user.lastName || ''}` : 'Unknown User'}
              </span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Title</label>
            <input
              type="text"
              placeholder="Notification title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/30 px-4 py-2.5 text-sm outline-none focus:border-[#10a353] focus:ring-2 focus:ring-[#10a353]/10 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Message</label>
            <textarea
              rows={4}
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50/30 px-4 py-2.5 text-sm outline-none focus:border-[#10a353] focus:ring-2 focus:ring-[#10a353]/10 transition-all resize-none"
            />
          </div>

          {/* Footer / Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 rounded-lg bg-[#10a353] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0d8a46] shadow-sm transition-all active:scale-95"
            >
              <Bell size={18} fill="currentColor" className="text-white" />
              <span>Send Notification</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendNotificationModal;
