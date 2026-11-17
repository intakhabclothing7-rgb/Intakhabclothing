import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  Images,
  Star,
  MessageSquare,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  ExternalLink,
  RefreshCw,
  Menu,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AdminRoleRecord } from '../../types';
import { DEFAULT_HERO_SLIDES } from '../../data/defaults';
import {
  AdminDashboardBundle,
  fetchAdminDashboardBundle,
  getAuthorizedAdmin,
  signOutAdmin,
} from '../../services/supabaseStore';
import { AdminLogin } from './AdminLogin';
import { AdminToast, ToastNotice } from './AdminShared';
import { ProductsPanel } from './ProductsPanel';
import { CategoriesPanel } from './CategoriesPanel';
import { HeroSliderPanel, ShowcaseBannerPanel, WebsiteContentPanel } from './HeroAndContentPanel';
import { BestSellersPanel, OrdersPanel } from './BestSellersAndOrdersPanel';
import { ReviewsPanel, SettingsPanel } from './ReviewsAndSettingsPanel';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'hero'
  | 'showcase'
  | 'bestsellers'
  | 'reviews'
  | 'orders'
  | 'content'
  | 'settings';

interface AdminDashboardProps {
  onBackToStore: () => void;
  onStorefrontDataChanged: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBackToStore,
  onStorefrontDataChanged,
}) => {
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminRoleRecord | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bundle, setBundle] = useState<AdminDashboardBundle | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastNotice | null>(null);

  const showToast = useCallback((notice: ToastNotice) => {
    setToast(notice);
    setTimeout(() => setToast(null), 4500);
  }, []);

  const loadBundle = useCallback(async () => {
    setIsLoadingData(true);
    setLoadError(null);
    try {
      const data = await fetchAdminDashboardBundle();
      setBundle(data);
      onStorefrontDataChanged();
    } catch (err: any) {
      setLoadError(err?.message || 'Unable to load dashboard data from Supabase.');
    } finally {
      setIsLoadingData(false);
    }
  }, [onStorefrontDataChanged]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const authorized = await getAuthorizedAdmin();
        if (active) {
          setAdminUser(authorized);
          setAuthError(null);
        }
      } catch (err: any) {
        if (active) {
          setAdminUser(null);
          setAuthError(err?.message || 'Unable to verify administrator session with Supabase.');
        }
      } finally {
        if (active) setAuthChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (adminUser) {
      loadBundle();
    }
  }, [adminUser, loadBundle]);

  const handleLogout = async () => {
    await signOutAdmin();
    setAdminUser(null);
    setBundle(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FAF6F2] flex flex-col items-center justify-center gap-3 text-xs text-stone-600">
        <Loader2 className="w-6 h-6 animate-spin text-stone-800" />
        <span>Verifying administrator session...</span>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <AdminLogin
        initialError={authError}
        onSuccess={(admin) => {
          setAuthError(null);
          setAdminUser(admin);
        }}
        onBackToStore={onBackToStore}
      />
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'products',
      label: 'Products',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: bundle?.products.length,
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <FolderOpen className="w-4 h-4" />,
      badge: bundle?.categories.length,
    },
    {
      id: 'hero',
      label: 'Hero Slider',
      icon: <Images className="w-4 h-4" />,
      badge: bundle ? bundle.heroSlides.length || DEFAULT_HERO_SLIDES.length : undefined,
    },
    {
      id: 'showcase',
      label: 'Showcase Banner',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'bestsellers',
      label: 'Best Sellers',
      icon: <Star className="w-4 h-4" />,
      badge: bundle?.bestSellers.length,
    },
    {
      id: 'reviews',
      label: 'Customer Reviews',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: bundle?.reviews.length,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: bundle?.orders.filter((o) => o.status === 'pending').length || undefined,
    },
    { id: 'content', label: 'Website Content', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col min-h-full justify-between">
      <div>
        <div className="p-5 border-b border-stone-200 bg-[#FAF6F2] flex items-center justify-between">
          <div>
            <img
              src="/assets/intakhab_calligraphy_logo.png"
              alt="Intakhab"
              className="h-9 w-auto object-contain"
            />
            <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-1">
              Admin Dashboard
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="lg:hidden p-1 text-stone-500 hover:text-black"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EDE1C8] text-black font-semibold border border-[#D8C7A5]'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-white text-black' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-stone-200 bg-[#FAF6F2] space-y-2.5 text-xs">
        <div className="truncate text-[11px] text-stone-500">
          Signed in as <strong className="text-stone-900">{adminUser.email}</strong>
        </div>
        <button
          type="button"
          onClick={onBackToStore}
          className="w-full py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Live Store</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2 px-3 bg-stone-900 hover:bg-black text-white font-semibold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  const liveReviewsCount = bundle?.reviews.filter((r) => r.status === 'approved').length || 0;
  const hiddenReviewsCount = bundle?.reviews.filter((r) => r.status === 'hidden').length || 0;
  const pendingOrdersCount = bundle?.orders.filter((o) => o.status === 'pending').length || 0;
  const totalRevenue =
    bundle?.orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.total, 0) || 0;

  return (
    <div className="min-h-screen bg-[#FAF6F2] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-stone-200 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl overflow-y-auto">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-20 bg-white border-b border-stone-200">
          <header className="px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 -ml-2 text-stone-700 hover:text-black cursor-pointer"
                aria-label="Open admin menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900 capitalize">
                  {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
                </h1>
                <p className="text-[11px] text-stone-500">
                  INTAKHAB Live Database & Media Control
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isLoadingData}
                onClick={loadBundle}
                className="px-3.5 py-2 border border-stone-300 hover:bg-stone-50 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </header>

          {/* Always-visible mobile/tablet admin menu bar */}
          <nav
            aria-label="Admin sections"
            className="lg:hidden border-t border-stone-200 bg-[#FAF6F2] px-3 py-2 flex items-center gap-1.5 overflow-x-auto"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#EDE1C8] text-black font-semibold border-[#D8C7A5]'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {item.icon}
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <main className="p-4 sm:p-8 flex-1 max-w-6xl w-full mx-auto">
          {loadError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {!bundle && isLoadingData ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-stone-500">
              <Loader2 className="w-6 h-6 animate-spin text-stone-800" />
              <span>Loading store records from Supabase...</span>
            </div>
          ) : bundle ? (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-stone-200 p-5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Active Products
                      </span>
                      <p className="font-serif text-3xl font-semibold text-stone-900 mt-1">
                        {bundle.products.filter((p) => p.isActive !== false).length}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {bundle.products.length} total SKUs
                      </p>
                    </div>

                    <div className="bg-white border border-stone-200 p-5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Total Orders
                      </span>
                      <p className="font-serif text-3xl font-semibold text-stone-900 mt-1">
                        {bundle.orders.length}
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium mt-1">
                        {pendingOrdersCount} pending fulfillment
                      </p>
                    </div>

                    <div className="bg-white border border-stone-200 p-5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Gross Order Value
                      </span>
                      <p className="font-serif text-3xl font-semibold text-stone-900 mt-1 tabular-nums">
                        Rs.{totalRevenue.toLocaleString('en-PK')}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-1">Excluding cancelled</p>
                    </div>

                    <div className="bg-white border border-stone-200 p-5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Customer Reviews
                      </span>
                      <p className="font-serif text-3xl font-semibold text-stone-900 mt-1">
                        {bundle.reviews.length}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium mt-1">
                        {liveReviewsCount} live · {hiddenReviewsCount} hidden
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 p-6 space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-stone-900">
                      Quick Management Shortcuts
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className="p-4 bg-[#FAF6F2] hover:bg-[#EDE1C8] border border-stone-200 text-left transition-colors cursor-pointer"
                      >
                        <strong className="block text-stone-900 uppercase tracking-wider">
                          Manage Products →
                        </strong>
                        <span className="text-stone-600 mt-1 block">
                          Add suits, upload gallery photos, edit prices & stock.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('hero')}
                        className="p-4 bg-[#FAF6F2] hover:bg-[#EDE1C8] border border-stone-200 text-left transition-colors cursor-pointer"
                      >
                        <strong className="block text-stone-900 uppercase tracking-wider">
                          Hero Slider Banners →
                        </strong>
                        <span className="text-stone-600 mt-1 block">
                          Upload desktop/mobile banners and change transition timing.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('showcase')}
                        className="p-4 bg-[#FAF6F2] hover:bg-[#EDE1C8] border border-stone-200 text-left transition-colors cursor-pointer"
                      >
                        <strong className="block text-stone-900 uppercase tracking-wider">
                          Showcase Banner →
                        </strong>
                        <span className="text-stone-600 mt-1 block">
                          Change the New Season Collection boutique showcase picture & text.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('reviews')}
                        className="p-4 bg-[#FAF6F2] hover:bg-[#EDE1C8] border border-stone-200 text-left transition-colors cursor-pointer"
                      >
                        <strong className="block text-stone-900 uppercase tracking-wider">
                          Manage Reviews →
                        </strong>
                        <span className="text-stone-600 mt-1 block">
                          View, hide/unhide, edit, reply to, or delete customer reviews.
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <ProductsPanel
                  products={bundle.products}
                  categories={bundle.categories}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesPanel
                  categories={bundle.categories}
                  products={bundle.products}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'hero' && (
                <HeroSliderPanel
                  slides={bundle.heroSlides}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'showcase' && (
                <ShowcaseBannerPanel
                  contentMap={bundle.homepageContent}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'bestsellers' && (
                <BestSellersPanel
                  entries={bundle.bestSellers}
                  products={bundle.products}
                  settings={bundle.settings}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'reviews' && (
                <ReviewsPanel
                  reviews={bundle.reviews}
                  auditLogs={bundle.auditLogs}
                  products={bundle.products}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersPanel
                  orders={bundle.orders}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'content' && (
                <WebsiteContentPanel
                  contentMap={bundle.homepageContent}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPanel
                  settings={bundle.settings}
                  onRefresh={loadBundle}
                  onNotify={showToast}
                />
              )}
            </>
          ) : null}
        </main>
      </div>

      <AdminToast notice={toast} onClose={() => setToast(null)} />
    </div>
  );
};
