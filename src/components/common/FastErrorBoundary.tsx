
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class FastErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('⚠️ Application Error:', error, errorInfo);
    
    // Report error to user
    toast.error('😞 कुछ गलत हुआ! Page refresh करने की कोशिश करें।');
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleQuickRefresh = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Quick refresh without full page reload
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-indigo-100">
          <Card className="max-w-md w-full border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-red-700">
                😔 कुछ गलत हो गया!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-gray-600">
                Study AI में एक technical error आया है। 
                <br />
                कृपया page को refresh करें।
              </p>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={this.handleQuickRefresh} 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh करें
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome} 
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Home जाएं
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                💡 <strong>Tips:</strong>
                <br />
                • Internet connection check करें
                <br />
                • Browser cache clear करें
                <br />
                • कुछ देर बाद try करें
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FastErrorBoundary;
