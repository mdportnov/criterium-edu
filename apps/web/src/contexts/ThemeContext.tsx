import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: 'light' | 'dark'; // The actual resolved theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem('theme') as Theme;
    return saved || defaultTheme;
  });

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Function to resolve the actual theme based on system preference
  const resolveTheme = (themeValue: Theme): 'light' | 'dark' => {
    if (themeValue === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return themeValue;
  };

  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    setCurrentTheme(resolved);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  }, []);

  const updateTheme = useCallback(
    (newTheme: Theme) => {
      applyTheme(resolveTheme(newTheme));
      try {
        localStorage.setItem('theme', newTheme);
      } catch {
        // Private mode or blocked storage: the choice just will not persist.
      }
      setTheme(newTheme);
    },
    [applyTheme],
  );

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(resolveTheme('system'));
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    applyTheme(resolveTheme(theme));

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: updateTheme,
        currentTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
