import React, { useState } from 'react';
import { BookOpen, Check, Copy, Database, Eye, EyeOff, FileCode2, X } from 'lucide-react';
import {
  getSupabaseClient,
  isSupabaseConnected,
  SUPABASE_SCHEMA_SQL,
} from '../../lib/supabase';
import type { PlannerUser } from '../../types/planner';

interface AuthPageProps {
  onSupabaseAuthSuccess?: () => void;
  onLocalAuthSuccess?: (user: PlannerUser, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSupabaseAuthSuccess,
  onLocalAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseReady = isSupabaseConnected();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const client = getSupabaseClient();

      if (client) {
        // Real Supabase Authentication
        if (mode === 'signin') {
          const { error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (error) throw error;
          onSupabaseAuthSuccess?.();
        } else {
          const { data, error } = await client.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: fullName.trim() || email.trim().split('@')[0],
              },
            },
          });
          if (error) throw error;
          if (data.session) {
            onSupabaseAuthSuccess?.();
          } else {
            setInfoMsg(
              'Account created in Supabase. Check your inbox to confirm your email address, or disable "Confirm email" in Supabase Auth settings for instant sign-in.'
            );
          }
        }
      } else {
        // Honest Local Preview Backend when Supabase credentials are not yet configured
        const endpoint =
          mode === 'signin' ? '/api/local-auth/signin' : '/api/local-auth/signup';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            ...(mode === 'signup' ? { full_name: fullName.trim() } : {}),
          }),
        });
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
          user?: PlannerUser;
          token?: string;
        };

        if (!res.ok || !payload.user || !payload.token) {
          throw new Error(payload.error || 'Unable to complete authentication.');
        }

        onLocalAuthSuccess?.(payload.user, payload.token);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to complete authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2200);
    } catch {
      setCopiedSql(false);
    }
  };

  return (
    <div className="paper-ivory paper-grain min-h-screen w-full text-[#2B211D]">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-12">
        {/* Left Editorial Cover */}
        <div className="relative hidden overflow-hidden border-r border-[#2B211D]/10 lg:col-span-6 lg:flex lg:flex-col lg:justify-between">
          <img
            src="/src/assets/images/stationery_auth_cover_1795506784831.jpg"
            alt="Open linen planner notebook with brass pen and dried chamomile"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#241915]/75 via-[#241915]/20 to-[#241915]/25" />

          <div className="relative z-10 flex items-center justify-between p-10">
            <div className="flex items-center gap-2.5 text-[#FFFDF9]">
              <BookOpen className="h-5 w-5" />
              <span className="font-serif text-2xl italic tracking-tight">Folio</span>
            </div>
            <span className="font-mono text-xs tracking-wider text-[#FFFDF9]/85 uppercase">
              Personal Almanac
            </span>
          </div>

          <div className="relative z-10 p-10 text-[#FFFDF9]">
            <p className="font-hand text-2xl text-[#F4E3AD]">
              &ldquo;Morning pages, fresh ink.&rdquo;
            </p>
            <h1 className="font-serif mt-2 max-w-md text-4xl leading-tight font-medium text-balance">
              A quiet, personal desk for the things that matter today.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#FFFDF9]/85">
              Organize college coursework, personal reminders, and creative projects in a
              tactile stationery workspace complete with curated collections and draggable
              scrapbook notes.
            </p>
          </div>
        </div>

        {/* Right Auth Form Column */}
        <div className="flex flex-col justify-between px-6 py-10 sm:px-12 lg:col-span-6 lg:px-16 lg:py-14">
          <div className="flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2 text-[#6D2E46]">
              <BookOpen className="h-5 w-5" />
              <span className="font-serif text-2xl italic">Folio</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6D2E46] underline underline-offset-4"
            >
              <Database className="h-3.5 w-3.5" />
              Supabase setup
            </button>
          </div>

          <div className="mx-auto my-auto w-full max-w-md py-8">
            <p className="font-mono text-xs tracking-wider text-[#8C7B72] uppercase">
              Personal Workspace
            </p>
            <h2 className="font-serif mt-1.5 text-3xl font-medium text-[#2B211D] sm:text-4xl">
              {mode === 'signin' ? 'Open your planner.' : 'Begin your first page.'}
            </h2>
            <p className="mt-2 text-sm text-[#6B5A52]">
              {mode === 'signin'
                ? 'Sign in to restore your tasks, custom collections, and sticker layout.'
                : 'Create your Folio account to start organizing your tasks and scrapbook layout.'}
            </p>

            {/* Honest storage notice when Supabase env vars are not yet configured */}
            {!supabaseReady && (
              <div className="mt-5 border border-[#C48291]/50 bg-[#F4E7EA]/65 p-4 text-sm text-[#4A2531]">
                <p className="font-medium">Supabase not connected — Local Preview Storage active</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5A3440]">
                  You can create an account and use all features right now using local
                  server storage. To switch to Supabase cloud persistence, set{' '}
                  <code className="font-mono font-medium">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono font-medium">VITE_SUPABASE_ANON_KEY</code> and
                  run the SQL schema.
                </p>
                <button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#6D2E46] underline underline-offset-4 hover:text-[#562336]"
                >
                  <FileCode2 className="h-3.5 w-3.5" />
                  View SQL Schema &amp; Env Setup
                </button>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="mt-6 flex border-b border-[#2B211D]/12">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`pb-2.5 pr-6 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'signin'
                    ? 'border-b-2 border-[#6D2E46] text-[#6D2E46]'
                    : 'text-[#6B5A52] hover:text-[#2B211D]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`px-6 pb-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  mode === 'signup'
                    ? 'border-b-2 border-[#6D2E46] text-[#6D2E46]'
                    : 'text-[#6B5A52] hover:text-[#2B211D]'
                }`}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-medium text-[#5A4A42]"
                  >
                    Your name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Clara Vance"
                    className="mt-1.5 w-full border border-[#2B211D]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-sm text-[#2B211D] placeholder:text-[#9E8E85] focus:border-[#6D2E46] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-[#5A4A42]"
                >
                  Email address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full border border-[#2B211D]/15 bg-[#FFFDF9] px-3.5 py-2.5 text-sm text-[#2B211D] placeholder:text-[#9E8E85] focus:border-[#6D2E46] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-[#5A4A42]"
                >
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full border border-[#2B211D]/15 bg-[#FFFDF9] px-3.5 py-2.5 pr-10 text-sm text-[#2B211D] placeholder:text-[#9E8E85] focus:border-[#6D2E46] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#8C7B72] hover:text-[#2B211D]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p role="alert" className="border border-[#8E354A]/30 bg-[#F4E7EA] px-3.5 py-2.5 text-xs text-[#6D2E46]">
                  {errorMsg}
                </p>
              )}

              {infoMsg && (
                <p role="status" className="border border-[#6E8268]/35 bg-[#E8EFE5] px-3.5 py-2.5 text-xs text-[#3C4B38]">
                  {infoMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6D2E46] px-5 py-2.5 text-sm font-medium text-[#FFFDF9] transition-colors hover:bg-[#562336] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? mode === 'signin'
                    ? 'Opening planner...'
                    : 'Creating account...'
                  : mode === 'signin'
                  ? 'Sign in to Folio'
                  : 'Create planner account'}
              </button>
            </form>
          </div>

          <div className="flex items-center justify-between border-t border-[#2B211D]/10 pt-5 text-xs text-[#6B5A52]">
            <span>
              {supabaseReady
                ? 'Secured with Supabase Auth & Row Level Security'
                : 'Local Preview Storage · Connect Supabase for cloud sync'}
            </span>
            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              className="font-medium text-[#6D2E46] underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              SQL Schema &amp; Setup
            </button>
          </div>
        </div>
      </div>

      {/* Supabase SQL Schema & Setup Modal */}
      {showSetupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#241915]/45 p-4 backdrop-blur-[1px]"
          onClick={() => setShowSetupModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-3xl flex-col border border-[#2B211D]/15 bg-[#FFFDF9] shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-[#2B211D]/10 px-6 py-4">
              <div>
                <p className="font-mono text-[11px] text-[#8C7B72] uppercase">
                  Supabase Backend Setup
                </p>
                <h3 className="font-serif text-2xl font-medium text-[#2B211D]">
                  Environment Variables &amp; PostgreSQL Schema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded text-[#5A4A42] hover:bg-[#F3EDE3]"
                aria-label="Close setup modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
              <div>
                <h4 className="font-medium text-[#2B211D]">1. Required Environment Variables</h4>
                <p className="mt-1 text-xs text-[#6B5A52]">
                  Add these public client variables to your environment or AI Studio Secrets
                  (never expose a Supabase <code className="font-mono">service_role</code> key):
                </p>
                <pre className="mt-2 overflow-x-auto border border-[#2B211D]/10 bg-[#FAF6F0] p-3 font-mono text-xs text-[#2B211D]">
{`VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-or-publishable-key"`}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-[#2B211D]">
                    2. SQL Tables, Default Seeder &amp; RLS Policies
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 border border-[#2B211D]/15 bg-[#FAF6F0] px-3 py-1 text-xs font-medium text-[#2B211D] hover:bg-[#F3EDE3]"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#6E8268]" />
                        Copied SQL
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy SQL
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#6B5A52]">
                  Paste and run this script inside your Supabase Dashboard &rarr; SQL Editor.
                </p>
                <pre className="mt-2 max-h-72 overflow-auto border border-[#2B211D]/10 bg-[#FAF6F0] p-3 font-mono text-[11px] leading-relaxed text-[#2B211D]">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
