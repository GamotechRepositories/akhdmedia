import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import CookieConsentBanner from './components/CookieConsentBanner';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';

const ActorsPage = lazy(() => import('./pages/ActorsPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const PayPalComplete = lazy(() => import('./pages/PayPalComplete'));
const Support = lazy(() => import('./pages/Support'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const EditorialPolicy = lazy(() => import('./pages/EditorialPolicy'));
const LicenseInformationPolicy = lazy(() => import('./pages/LicenseInformationPolicy'));
const LegalPolicy = lazy(() => import('./pages/LegalPolicy'));
const MediaAccreditationPolicy = lazy(() => import('./pages/MediaAccreditationPolicy'));
const CopyrightPolicy = lazy(() => import('./pages/CopyrightPolicy'));
const DmcaCopyrightInfringementPolicy = lazy(() => import('./pages/DmcaCopyrightInfringementPolicy'));
const AcceptableUsePolicy = lazy(() => import('./pages/AcceptableUsePolicy'));
const AiUsagePolicy = lazy(() => import('./pages/AiUsagePolicy'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));
const FromIosApp = lazy(() => import('./pages/FromIosApp'));

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center bg-gray-50" aria-busy="true">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
  </div>
);

function AppContent() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <ScrollToTop />
      <Navbar />
      <main className="mobile-page-bottom flex-grow">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/actors" element={<ActorsPage />} />
            <Route path="/videos" element={<CategoryPage />} />
            <Route path="/videos/:category/:subCategory" element={<CategoryPage />} />
            <Route path="/videos/:category" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/from-app" element={<FromIosApp />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/paypal/complete" element={<PayPalComplete />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/support" element={<Support />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/editorial-policy" element={<EditorialPolicy />} />
            <Route path="/license-information-policy" element={<LicenseInformationPolicy />} />
            <Route path="/legal-policy" element={<LegalPolicy />} />
            <Route path="/media-accreditation-policy" element={<MediaAccreditationPolicy />} />
            <Route path="/copyright-policy" element={<CopyrightPolicy />} />
            <Route path="/dmca-copyright-infringement-policy" element={<DmcaCopyrightInfringementPolicy />} />
            <Route path="/acceptable-use-policy" element={<AcceptableUsePolicy />} />
            <Route path="/ai-usage-policy" element={<AiUsagePolicy />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
            </Route>
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <BackToTop />
      <CookieConsentBanner />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
