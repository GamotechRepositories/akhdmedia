import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import CategoryForm from './pages/CategoryForm'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'

const App = () => (
  <Routes>
    <Route element={<AdminLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="categories" element={<Categories />} />
      <Route path="categories/new" element={<CategoryForm />} />
      <Route path="categories/:id/edit" element={<CategoryForm />} />
      <Route path="products" element={<Products />} />
      <Route path="products/new" element={<ProductForm />} />
      <Route path="products/:id/edit" element={<ProductForm />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
)

export default App
