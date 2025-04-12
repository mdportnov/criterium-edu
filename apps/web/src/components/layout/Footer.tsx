export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer footer-center p-6 bg-base-200 text-base-content rounded">
      <div>
        <p>Copyright © {currentYear} - Criterium EDU - All rights reserved</p>
      </div>
    </footer>
  );
};
