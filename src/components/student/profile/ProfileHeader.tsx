
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileHeader: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center mb-4">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate(-1)}
        className="mr-2"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h1 className="text-xl font-bold">छात्र प्रोफाइल</h1>
    </div>
  );
};

export default ProfileHeader;
