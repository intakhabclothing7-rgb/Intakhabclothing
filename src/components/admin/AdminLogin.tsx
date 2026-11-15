import React, { useEffect, useState } from 'react';
import { Lock, ArrowLeft, Loader2, AlertCircle, ShieldCheck, Database } from 'lucide-react';
import { isSupabaseConfigured, supabaseConfigError } from '../../lib/supabase';
import { signInAdmin, verifyCategoriesConnection } from '../../services/supabaseStore';
import { AdminRoleRecord } from '../../types';

interface AdminLoginProps {
  initialError?: string | null;
  onSuccess: (admin: AdminRoleRecord) => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  initialError,
  onSuccess,
  onBackToStore,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [connectionCheckError, setConnectionCheckError] = useState<string | null>(null);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      try {
        const res = await verifyCategoriesConnection();
        if (active && !res.ok) {
          setConnectionCheckError(res.error || 'Supabase categories query failed.');
        }
      } catch (err: any) {
        if (active) {
          setConnectionCheckError(err?.message || 'Unable to reach Supabase.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const admin = await signInAdmin(email, password);
      onSuccess(admin);
    } catch (err: any) {
      setError(err?.message || 'Sign in failed. Verify your admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F2] flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-stone-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#EDE1C8]/45 border-b border-[#D8C7A5] flex flex-col items-center text-center space-y-2">
          <img
            src="/assets/intakhab_calligraphy_logo.png"
            alt="Intakhab - انتخاب"
            className="h-12 w-auto object-contain"
          />
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Admin Portal</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {!isSupabaseConfigured ? (
            <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
              <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-2.5">
                <Database className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <div>
                  <strong className="block font-semibold">Supabase Configuration Required</strong>
                  <p className="mt-1">
                    {supabaseConfigError ||
                      'Connect your Supabase project to enable Admin Authentication, PostgreSQL persistence, and Media Storage uploads.'}
                  </p>
                </div>
              </div>

              <div className="bg-[#FAF6F2] p-4 border border-stone-200 space-y-2">
                <p className="font-bold uppercase tracking-wider text-stone-900 text-[11px]">
                  Required Environment Variables
                </p>
                <pre className="text-[11px] font-mono bg-stone-900 text-stone-100 p-3 overflow-x-auto">
{`VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY`}
                </pre>
                <p className="text-[11px] text-stone-600 pt-1">
                  Legacy <code>VITE_SUPABASE_ANON_KEY</code> is also supported as an alias. Never place <code>service_role</code> or <code>sb_secret_*</code> keys in frontend environment variables. On Cloudflare Pages, save both variables for Production &amp; Preview and trigger a fresh deployment so Vite bundles them.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {connectionCheckError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{connectionCheckError}</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="intakhabclothing7@gmail.com"
                  className="w-full text-xs py-2.5 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs py-2.5 px-3 border border-stone-300 focus:outline-none focus:border-[#D8C7A5]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#EDE1C8] hover:bg-[#dfd0b2] text-black border border-[#D8C7A5] text-xs font-semibold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>{isLoading ? 'Verifying Access...' : 'Sign In to Dashboard'}</span>
              </button>

              <p className="text-[11px] text-center text-stone-500 pt-1">
                Private portal for authorized Intakhab administrators only.
              </p>
            </form>
          )}

          <div className="pt-4 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-black transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Live Storefront</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
