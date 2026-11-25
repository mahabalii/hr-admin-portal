
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import { store } from './store/store'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />

      <ToastContainer
        position="top-right"
        autoClose={1500}
        hideProgressBar
        closeOnClick
        pauseOnHover={false}
        draggable={false}
        theme="colored"
      />
    </Provider>
  </StrictMode>,
)
