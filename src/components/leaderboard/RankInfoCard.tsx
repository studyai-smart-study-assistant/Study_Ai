
import React from 'react';
import { Users } from 'lucide-react';

const RankInfoCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
      <h3 className="font-medium text-purple-800 dark:text-purple-300 flex items-center mb-2">
        <Users className="h-4 w-4 mr-2" />
        रैंकिंग कैसे काम करती है?
      </h3>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        स्टडी AI पर अध्ययन करके, क्विज हल करके, और लगातार अध्ययन स्ट्रीक बनाए रखकर XP अर्जित करें। जितने अधिक XP, उतनी उच्च रैंकिंग!
      </p>
    </div>
  );
};

export default RankInfoCard;
