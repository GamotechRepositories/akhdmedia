import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import CategoryForm from './pages/CategoryForm'
import Actors from './pages/Actors'
import ActorForm from './pages/ActorForm'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Transactions from './pages/Transactions'
import TransactionDetail from './pages/TransactionDetail'
import Revenue from './pages/Revenue'
import Users from './pages/Users'
import Support from './pages/Support'
import SupportDetail from './pages/SupportDetail'
import HomeContent from './pages/HomeContent'
import PromoCodes from './pages/PromoCodes'
import PromoCodeForm from './pages/PromoCodeForm'
import Login from './pages/Login'

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="home-content" element={<HomeContent />} />
        <Route path="categories" element={<Categories />} />
        <Route path="categories/new" element={<CategoryForm />} />
        <Route path="categories/:id/edit" element={<CategoryForm />} />
        <Route path="actors" element={<Actors />} />
        <Route path="actors/new" element={<ActorForm />} />
        <Route path="actors/:id/edit" element={<ActorForm />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="promo-codes" element={<PromoCodes />} />
        <Route path="promo-codes/new" element={<PromoCodeForm />} />
        <Route path="promo-codes/:id/edit" element={<PromoCodeForm />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="transactions/:id" element={<TransactionDetail />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="users" element={<Users />} />
        <Route path="support" element={<Support />} />
        <Route path="support/:id" element={<SupportDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Route>
  </Routes>
)

export default App
