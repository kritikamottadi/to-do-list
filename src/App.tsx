/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  getLocalAuthToken,
  getSupabaseClient,
  initSupabaseFromServerConfig,
  setLocalAuthToken,
} from './lib/supabase';
import type { PlannerUser } from './types/planner';
import { AuthPage } from './components/auth/AuthPage';
import { PlannerWorkspace } from './components/planner/PlannerWorkspace';

export default function App() {
  const [user, setUser] = useState<PlannerUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function bootstrap() {
      await initSupabaseFromServerConfig();
      const client = getSupabaseClient();

      if (!client) {
        if (mounted) setAuthReady(true);
        return;
      }

      const { data } = await client.auth.getSession();
      if (mounted) {
        setUser(data.session?.user ?? null);
        setAuthReady(true);
      }

      const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (mounted) {
          setUser(nextSession?.user ?? null);
          setAuthReady(true);
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();
    }

    bootstrap();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const handleLocalAuthSuccess = (nextUser: PlannerUser, token: string) => {
    setLocalAuthToken(token);
    setUser(nextUser);
  };

  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    } else {
      const token = getLocalAuthToken();
      if (token) {
        await fetch('/api/local-auth/signout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      setLocalAuthToken(null);
    }
    setUser(null);
  };

  if (!authReady) {
    return (
      <div className="paper-ivory paper-grain flex min-h-screen items-center justify-center text-[#2B211D]">
        <div className="text-center">
          <p className="font-serif text-2xl italic text-[#6D2E46]">Folio</p>
          <p className="mt-2 font-mono text-xs text-[#7C6A61]">Opening your pages...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLocalAuthSuccess={handleLocalAuthSuccess} />;
  }

  return <PlannerWorkspace user={user} onSignOut={handleSignOut} />;
}
