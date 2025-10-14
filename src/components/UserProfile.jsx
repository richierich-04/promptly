// UserProfile Component for managing user account and logout
import React, { useState } from 'react';
import { User, Mail, LogOut, Settings, Loader } from 'lucide-react';
import { logOut } from '../firebase/auth';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = ({ onLogout }) => {
  const { currentUser, setError } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await logOut();
    
    if (error) {
      setError(error);
    } else {
      onLogout?.();
    }
    
    setLoading(false);
  };

  const formatJoinDate = (user) => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Unknown';
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Account Settings
        </h3>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {currentUser.displayName 
                ? currentUser.displayName.charAt(0).toUpperCase()
                : currentUser.email.charAt(0).toUpperCase()
              }
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">
                {currentUser.displayName || 'User'}
              </h4>
              <p className="text-gray-300 text-sm">
                Member since {formatJoinDate(currentUser)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Display Name
              </label>
              <div className="flex items-center gap-2 text-white">
                <User className="w-4 h-4 text-gray-400" />
                <span>{currentUser.displayName || 'Not set'}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 text-white">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{currentUser.email}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Verification
              </label>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${currentUser.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-sm ${currentUser.emailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {currentUser.emailVerified ? 'Verified' : 'Not verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="pt-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;