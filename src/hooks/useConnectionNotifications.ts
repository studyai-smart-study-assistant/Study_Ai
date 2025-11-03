import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const useConnectionNotifications = (currentUserId: string) => {
  const [lastCheckedCount, setLastCheckedCount] = useState(0);

  useEffect(() => {
    const checkForNewRequests = () => {
      const incomingKey = `${currentUserId}_incoming_requests`;
      const incoming = localStorage.getItem(incomingKey);
      
      if (incoming) {
        const incomingArray = JSON.parse(incoming);
        const currentCount = incomingArray.length;
        
        // Check if there are new requests since last check
        if (currentCount > lastCheckedCount && lastCheckedCount > 0) {
          const newRequestsCount = currentCount - lastCheckedCount;
          toast.info(
            `आपको ${newRequestsCount} नई connection request${newRequestsCount > 1 ? 's' : ''} मिली है! 🎉`,
            {
              duration: 5000,
              action: {
                label: 'देखें',
                onClick: () => {
                  // Navigate to connections tab
                  window.location.hash = '#connections-requests';
                }
              }
            }
          );
        }
        
        setLastCheckedCount(currentCount);
      }
    };

    // Check immediately on mount
    checkForNewRequests();

    // Check every 30 seconds for new requests
    const interval = setInterval(checkForNewRequests, 30000);

    return () => clearInterval(interval);
  }, [currentUserId, lastCheckedCount]);

  return { lastCheckedCount };
};
