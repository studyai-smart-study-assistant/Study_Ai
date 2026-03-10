import React, { useState, useEffect, useContext, createContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ 
  children, 
  defaultTheme = 'light', 
  storageKey = 'theme' 
}: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem(storageKey) as Theme | null;
      if (savedTheme) {
        return savedTheme;
      }
    } catch (e) {
      console.error("Failed to access localStorage for theme", e);
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
        localStorage.setItem(storageKey, theme);
    } catch (e) {
        console.error("Failed to save theme to localStorage", e);
    }
  }, [theme, storageKey]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
