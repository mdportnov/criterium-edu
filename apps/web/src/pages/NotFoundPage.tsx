import { Link } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';

const NotFoundPage = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold mt-4">Page Not Found</h2>
        <p className="mt-4 text-lg text-base-content/70">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary mt-8">
          Go Home
        </Link>
      </div>
    </ThemeProvider>
  );
};

export default NotFoundPage;
