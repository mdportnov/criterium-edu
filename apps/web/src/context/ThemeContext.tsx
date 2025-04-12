import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  systemTheme: 'light' | 'dark';
  currentTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read the initial theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'system';
  });
  
  // Track the system's preferred color scheme
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Calculate the current effective theme (either user choice or system preference)
  const currentTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    // Check for system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    // Listen for changes in system preference
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply the current theme to the document
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Save the theme preference to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, currentTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'system') {
      setThemeState(systemTheme === 'light' ? 'dark' : 'light');
    } else {
      setThemeState(theme === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, systemTheme, currentTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
