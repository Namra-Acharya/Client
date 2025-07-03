import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found. Check your index.html.");
}
