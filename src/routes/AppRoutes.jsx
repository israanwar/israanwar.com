import { Component, lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { RequireStaff, RequireAdmin } from "./RouteGuards";
import { clearChunkReloadMarker, importWithRetry } from "./lazyWithRetry";

function RouteLoadSuccess({ component: LoadedComponent, componentProps }) {
  useEffect(() => {
    clearChunkReloadMarker();
  }, []);

  return <LoadedComponent {...componentProps} />;
}

function lazyNamed(loader, exportName, { marksRouteReady = true } = {}) {
  return lazy(() => importWithRetry(loader).then((module) => {
    const LoadedComponent = module[exportName];
    if (!LoadedComponent) {
      throw new Error(`Lazy module does not export ${exportName}`);
    }

    if (!marksRouteReady) return { default: LoadedComponent };

    return {
      default: function LoadedRoute(componentProps) {
        return <RouteLoadSuccess component={LoadedComponent} componentProps={componentProps} />;
      },
    };
  }));
}

const LandingPage = lazyNamed(() => import("../pages/public/LandingPage"), "LandingPage");
const AboutPage = lazyNamed(() => import("../pages/public/AboutPage"), "AboutPage");
const ServicesPage = lazyNamed(() => import("../pages/public/ServicesPage"), "ServicesPage");
const ServiceDetailPage = lazyNamed(() => import("../pages/public/ServiceDetailPage"), "ServiceDetailPage");
const ContactPage = lazyNamed(() => import("../pages/public/ContactPage"), "ContactPage");
const PortfolioPage = lazyNamed(() => import("../pages/public/PortfolioPage"), "PortfolioPage");
const ToolsPage = lazyNamed(() => import("../pages/public/ToolsPage"), "ToolsPage");
const ToolDetailPage = lazyNamed(() => import("../pages/public/ToolDetailPage"), "ToolDetailPage");
const PrivacyPage = lazyNamed(() => import("../pages/public/PrivacyPage"), "PrivacyPage");
const TermsPage = lazyNamed(() => import("../pages/public/TermsPage"), "TermsPage");
const NotFoundPage = lazyNamed(() => import("../pages/public/NotFoundPage"), "NotFoundPage");
const BlogListPage = lazyNamed(() => import("../pages/public/BlogListPage"), "BlogListPage");
const BlogSlugRouter = lazyNamed(() => import("../pages/public/BlogSlugRouter"), "BlogSlugRouter");
const SitemapPage = lazyNamed(() => import("../pages/public/SitemapPage"), "SitemapPage");
const StorePage = lazyNamed(() => import("../pages/public/StorePage"), "StorePage");
const StoreItemPage = lazyNamed(() => import("../pages/public/StoreItemPage"), "StoreItemPage");
const CartPage = lazyNamed(() => import("../pages/public/CartPage"), "CartPage");
const CheckoutPage = lazyNamed(() => import("../pages/public/CheckoutPage"), "CheckoutPage");
const PaymentPage = lazyNamed(() => import("../pages/public/PaymentPage"), "PaymentPage");

const PublicLayout = lazyNamed(() => import("../layouts/PublicLayout"), "PublicLayout", { marksRouteReady: false });
const AdminLoginPage = lazyNamed(() => import("../pages/admin/AdminLoginPage"), "AdminLoginPage");
const AdminLayout = lazyNamed(() => import("../layouts/AdminLayout"), "AdminLayout", { marksRouteReady: false });
const AdminDashboardPage = lazyNamed(() => import("../pages/admin/AdminDashboardPage"), "AdminDashboardPage");
const AdminPostsPage = lazyNamed(() => import("../pages/admin/AdminPostsPage"), "AdminPostsPage");
const AdminPostEditPage = lazyNamed(() => import("../pages/admin/AdminPostEditPage"), "AdminPostEditPage");
const AdminStorePage = lazyNamed(() => import("../pages/admin/AdminStorePage"), "AdminStorePage");
const AdminStoreItemEditPage = lazyNamed(() => import("../pages/admin/AdminStoreItemEditPage"), "AdminStoreItemEditPage");
const AdminOrdersPage = lazyNamed(() => import("../pages/admin/AdminOrdersPage"), "AdminOrdersPage");
const AdminMediaPage = lazyNamed(() => import("../pages/admin/AdminMediaPage"), "AdminMediaPage");
const AdminHomepagePage = lazyNamed(() => import("../pages/admin/AdminHomepagePage"), "AdminHomepagePage");
const AdminUsersPage = lazyNamed(() => import("../pages/admin/AdminUsersPage"), "AdminUsersPage");
const AdminSettingsPage = lazyNamed(() => import("../pages/admin/AdminSettingsPage"), "AdminSettingsPage");
const AdminServicesPage = lazyNamed(() => import("../pages/admin/AdminServicesPage"), "AdminServicesPage");
const AdminServiceEditPage = lazyNamed(() => import("../pages/admin/AdminServiceEditPage"), "AdminServiceEditPage");
const AdminContactsPage = lazyNamed(() => import("../pages/admin/AdminContactsPage"), "AdminContactsPage");
const AdminNewsletterPage = lazyNamed(() => import("../pages/admin/AdminNewsletterPage"), "AdminNewsletterPage");
const AdminPagesPage = lazyNamed(() => import("../pages/admin/AdminPagesPage"), "AdminPagesPage");

// The in-flight Suspense state for a normal route-chunk fetch, not a
// failure. It must stay visually silent — the body is already the site's
// black (see globals.css) — so a normal load or reload never flashes
// "Loading..." text or a reload control at the user. Genuine failures are
// handled below by RouteErrorBoundary instead.
function RouteFallback() {
  return <div style={{ minHeight: "100vh" }} aria-hidden="true" />;
}

// A persistent chunk failure after the one guarded reload, or any ordinary
// application exception, remains visible and debuggable instead of being
// hidden behind Suspense forever.
class RouteErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Route failed to load:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div style={{
          minHeight: "100vh", display: "grid", placeItems: "center", gap: 16,
          textAlign: "center", color: "#8b8b94", padding: 24,
        }}>
          <div>
            <p style={{ marginBottom: 16 }}>Halaman gagal dimuat. Periksa koneksi internet Anda.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px", borderRadius: 999, border: "1px solid currentColor",
                background: "transparent", color: "inherit", cursor: "pointer", fontSize: 14,
              }}
            >
              Coba lagi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppRoutes() {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/:slug" element={<ToolDetailPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/blog" element={<BlogListPage />} />
          {/* /blog/:slug bisa berupa category slug ATAU post slug.
              BlogSlugRouter melakukan disambiguation runtime. */}
          <Route path="/blog/:slug" element={<BlogSlugRouter />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/store/:slug" element={<StoreItemPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:orderNumber/payment" element={<PaymentPage />} />
          {/* Legacy: /order/:id -> same page for backward compat */}
          <Route path="/order/:orderNumber" element={<PaymentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin (staff-only) */}
        <Route element={<RequireStaff />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/posts" element={<AdminPostsPage />} />
            <Route path="/admin/posts/:id" element={<AdminPostEditPage />} />
            <Route path="/admin/store" element={<AdminStorePage />} />
            <Route path="/admin/store/:id" element={<AdminStoreItemEditPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
            <Route path="/admin/services/:id" element={<AdminServiceEditPage />} />
            <Route path="/admin/contacts" element={<AdminContactsPage />} />
            <Route path="/admin/newsletter" element={<AdminNewsletterPage />} />
            <Route path="/admin/homepage" element={<AdminHomepagePage />} />
            <Route path="/admin/pages" element={<AdminPagesPage />} />
            <Route path="/admin/media" element={<AdminMediaPage />} />
            {/* Admin-only */}
            <Route element={<RequireAdmin />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Route>
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
