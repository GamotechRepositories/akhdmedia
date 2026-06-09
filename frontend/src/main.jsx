import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CatalogProvider } from './context/CatalogContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './components/ToastContainer'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CatalogProvider>
      <CartProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </CartProvider>
    </CatalogProvider>
  </StrictMode>,
)
