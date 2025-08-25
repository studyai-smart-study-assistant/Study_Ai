
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle, ExternalLink, Flame, Star, Target, Clock, Award, BarChart3 } from 'lucide-react';

const StudentActivitiesHelp = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 absolute top-4 right-4"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-500" />
            अध्ययन गतिविधियां सहायता
          </SheetTitle>
          <SheetDescription>
            यहां आपको अपनी अध्ययन गतिविधियों के बारे में जानकारी मिलेगी
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              अध्ययन टाइमर
            </h3>
            <p className="text-sm text-gray-500">
              पोमोडोरो तकनीक पर आधारित अध्ययन टाइमर का उपयोग करके अपनी एकाग्रता बढ़ाएं। 25 मिनट का अध्ययन सत्र पूरा करने पर आपको पॉइंट्स मिलेंगे।
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              दैनिक स्ट्रीक
            </h3>
            <p className="text-sm text-gray-500">
              हर दिन चेक-इन करके अपनी स्ट्रीक बनाए रखें। लंबी स्ट्रीक से आपको अतिरिक्त पॉइंट्स मिलेंगे।
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-500" />
              अध्ययन लक्ष्य
            </h3>
            <p className="text-sm text-gray-500">
              अपने अध्ययन के लिए समय लक्ष्य निर्धारित करें और उन्हें पूरा करके अतिरिक्त पॉइंट्स अर्जित करें।
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              लर्निंग प्रोग्रेस
            </h3>
            <p className="text-sm text-gray-500">
              अपनी अध्ययन प्रगति का विश्लेषण देखें और समझें कि आप किस विषय में अच्छा प्रदर्शन कर रहे हैं।
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              पॉइंट्स और लेवल
            </h3>
            <p className="text-sm text-gray-500">
              गतिविधियों को पूरा करके पॉइंट्स कमाएं और लेवल अप करें। हर 100 पॉइंट्स पर आप एक लेवल ऊपर जाएंगे और बोनस पॉइंट्स मिलेंगे।
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              QR कोड प्रोफाइल
            </h3>
            <p className="text-sm text-gray-500">
              अपना QR कोड शेयर करें और दोस्तों के साथ अपनी उपलब्धियां साझा करें। QR कोड स्कैन करके अपने दोस्तों की प्रगति भी देख सकते हैं।
            </p>
          </div>
        </div>
        
        <SheetFooter className="mt-6">
          <Button className="w-full flex items-center gap-2" variant="outline">
            <ExternalLink className="h-4 w-4" />
            और जानकारी पाएं
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default StudentActivitiesHelp;
