import { Outlet } from 'react-router-dom';
import { useToast } from './hooks';

function App() {
  const { ToastContainer } = useToast();

  return (
    <>
      <Outlet />
      <ToastContainer />
    </>
  );
}

export default App;
