
import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import NotificationTest from '@/components/notifications/NotificationTest';
import { useLanguage } from '@/contexts/LanguageContext';

const NotificationsTestPage: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === 'hi';

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isHindi ? 'नोटिफिकेशन परीक्षण' : 'Notification Testing'}
        </h1>
        
        <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">
            {isHindi ? 'नोटिफिकेशन सिस्टम' : 'Notification System'}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {isHindi 
              ? 'इस पेज पर आप नोटिफिकेशन सिस्टम का परीक्षण कर सकते हैं। यह सिस्टम WebView और वेब ब्राउज़र दोनों पर काम करता है।'
              : 'On this page, you can test the notification system. This system works on both WebView and web browsers.'
            }
          </p>
          
          <NotificationTest />
        </div>
      </div>
    </PageLayout>
  );
};

export default NotificationsTestPage;
