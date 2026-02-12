'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { spaceService } from '@/services/space-service';

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login preserving the invite link as return destination
      // The auth system likely uses 'redirect' query param or just redirects back to referrer?
      // Assuming /auth/login handles 'redirect' or 'from'.
      // If not supported, user will have to click link again.
      // I'll try to use ?redirect= parameter.
      router.push(`/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
    }
  }, [user, authLoading, router, token]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
            <h2 className="text-xl text-gray-700 dark:text-gray-300">Checking authentication...</h2>
        </div>
      </div>
    );
  }

  async function handleJoin() {
    setJoining(true);
    setError('');
    try {
        const result = await spaceService.joinSpace(token);
        router.push(`/spaces/${result.spaceId}`);
    } catch (err: any) {
        setError(err.message || 'Failed to join space. The invitation may be invalid or expired.');
        setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Workspace Invitation</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You have been invited to join a DocStudio workspace.
        </p>
        
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
                {error}
            </div>
        )}

        <div className="flex gap-4 justify-center">
            <button
                onClick={() => router.push('/spaces')}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
            >
                Cancel
            </button>
            <button
                onClick={handleJoin}
                disabled={joining}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
                {joining ? 'Joining...' : 'Join Workspace'}
            </button>
        </div>
      </div>
    </div>
  );
}
