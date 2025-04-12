import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useToast } from './hooks';

function App() {
  const { ToastContainer } = useToast();
  
  // Set theme from localStorage or default to light
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);
  
  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  );
}

export default App;
