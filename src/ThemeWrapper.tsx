
import { ThemeProvider } from "./providers/ThemeProvider";
import { LanguageProvider } from './contexts/LanguageContext';
import { QueryProvider } from './providers/QueryProvider';

interface ThemeWrapperProps {
  children: React.ReactNode
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <LanguageProvider>
        <QueryProvider>
          {children}
        </QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
