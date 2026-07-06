import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import CookieConsentBanner from './components/CookieConsentBanner';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import ActorsPage from './pages/ActorsPage';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import PayPalComplete from './pages/PayPalComplete';
import Support from './pages/Support';
import RefundPolicy from './pages/RefundPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import EditorialPolicy from './pages/EditorialPolicy';
import LicenseInformationPolicy from './pages/LicenseInformationPolicy';
import LegalPolicy from './pages/LegalPolicy';
import MediaAccreditationPolicy from './pages/MediaAccreditationPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <ScrollToTop />
      <Navbar />
      <main className="mobile-page-bottom flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/actors" element={<ActorsPage />} />
          <Route path="/videos" element={<CategoryPage />} />
          <Route path="/videos/:category/:subCategory" element={<CategoryPage />} />
          <Route path="/videos/:category" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
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
