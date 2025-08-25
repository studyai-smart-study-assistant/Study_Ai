
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-950 p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto flex items-center justify-center mb-6">
          <span className="text-4xl font-bold text-red-500">404</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">पेज नहीं मिला</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          आपके द्वारा खोजा गया पेज मौजूद नहीं है या हटा दिया गया है
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              होम पेज पर जाएं
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/chat">
              चैट करें
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
