
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileNotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">प्रोफाइल नहीं मिला</h2>
          <p className="text-gray-500 mb-4">
            यह प्रोफाइल मौजूद नहीं है या फिर हटा दिया गया है।
          </p>
          <Button onClick={() => navigate('/')}>
            होम पेज पर जाएं
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileNotFound;
