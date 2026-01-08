import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              वापस जाएं
            </Link>
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            गोपनीयता नीति (Privacy Policy)
          </h1>
          
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 text-gray-700 dark:text-gray-300 pr-4">
              <p className="text-sm text-muted-foreground">
                अंतिम अपडेट: जनवरी 2026
              </p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. परिचय
                </h2>
                <p>
                  Study AI ("हम", "हमारा", या "हमारी") आपकी गोपनीयता का सम्मान करता है। 
                  यह नीति बताती है कि हम आपकी व्यक्तिगत जानकारी कैसे एकत्र, उपयोग और सुरक्षित करते हैं।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. हम कौन सी जानकारी एकत्र करते हैं
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>नाम और ईमेल पता</li>
                  <li>शिक्षा स्तर और श्रेणी</li>
                  <li>ऐप उपयोग डेटा (अध्ययन समय, पॉइंट्स, आदि)</li>
                  <li>डिवाइस जानकारी</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. हम जानकारी का उपयोग कैसे करते हैं
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>आपके खाते को प्रबंधित करने के लिए</li>
                  <li>व्यक्तिगत अध्ययन अनुभव प्रदान करने के लिए</li>
                  <li>ऐप सुधार और नई सुविधाओं के लिए</li>
                  <li>तकनीकी सहायता प्रदान करने के लिए</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. डेटा सुरक्षा
                </h2>
                <p>
                  हम आपके डेटा की सुरक्षा के लिए उद्योग-मानक एन्क्रिप्शन और सुरक्षा उपायों का उपयोग करते हैं।
                  आपका डेटा Firebase और Supabase जैसी सुरक्षित क्लाउड सेवाओं पर संग्रहीत है।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. तृतीय-पक्ष सेवाएं
                </h2>
                <p>
                  हम निम्नलिखित तृतीय-पक्ष सेवाओं का उपयोग करते हैं:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Firebase (प्रमाणीकरण और डेटाबेस)</li>
                  <li>Google OAuth (साइन इन)</li>
                  <li>AI सेवाएं (शैक्षिक सहायता के लिए)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. आपके अधिकार
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>अपना डेटा देखने और डाउनलोड करने का अधिकार</li>
                  <li>अपना डेटा हटाने का अधिकार</li>
                  <li>डेटा संग्रह से ऑप्ट-आउट करने का अधिकार</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. संपर्क करें
                </h2>
                <p>
                  गोपनीयता संबंधी प्रश्नों के लिए हमसे संपर्क करें:
                  <br />
                  <a href="mailto:privacy@studyai.app" className="text-purple-600 hover:underline">
                    privacy@studyai.app
                  </a>
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
