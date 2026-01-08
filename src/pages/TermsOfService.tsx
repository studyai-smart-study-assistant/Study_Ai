import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsOfService = () => {
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
            सेवा की शर्तें (Terms of Service)
          </h1>
          
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 text-gray-700 dark:text-gray-300 pr-4">
              <p className="text-sm text-muted-foreground">
                अंतिम अपडेट: जनवरी 2026
              </p>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. स्वीकृति
                </h2>
                <p>
                  Study AI का उपयोग करके, आप इन शर्तों से सहमत होते हैं। यदि आप सहमत नहीं हैं, 
                  तो कृपया ऐप का उपयोग न करें।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. सेवा का विवरण
                </h2>
                <p>
                  Study AI एक AI-संचालित शैक्षिक प्लेटफॉर्म है जो प्रदान करता है:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>AI-आधारित प्रश्न-उत्तर सहायता</li>
                  <li>नोट्स जनरेशन</li>
                  <li>अध्ययन ट्रैकिंग और गेमिफिकेशन</li>
                  <li>पुस्तकालय और संसाधन</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. खाता जिम्मेदारियां
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>आपको सटीक जानकारी प्रदान करनी होगी</li>
                  <li>अपने खाते की सुरक्षा आपकी जिम्मेदारी है</li>
                  <li>13 वर्ष से कम उम्र के उपयोगकर्ताओं को माता-पिता की सहमति चाहिए</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. स्वीकार्य उपयोग
                </h2>
                <p>आप सहमत हैं कि:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>ऐप का उपयोग केवल शैक्षिक उद्देश्यों के लिए करेंगे</li>
                  <li>अनुचित या हानिकारक सामग्री साझा नहीं करेंगे</li>
                  <li>अन्य उपयोगकर्ताओं को परेशान नहीं करेंगे</li>
                  <li>ऐप को हैक या बाधित करने का प्रयास नहीं करेंगे</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. बौद्धिक संपदा
                </h2>
                <p>
                  Study AI और इसकी सामग्री हमारी बौद्धिक संपदा है। 
                  आप बिना अनुमति के इसे कॉपी, संशोधित या वितरित नहीं कर सकते।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. AI सामग्री अस्वीकरण
                </h2>
                <p>
                  AI द्वारा उत्पन्न सामग्री केवल सहायता के लिए है और 100% सटीक नहीं हो सकती।
                  महत्वपूर्ण निर्णयों के लिए अन्य स्रोतों से भी सत्यापित करें।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. सेवा में परिवर्तन
                </h2>
                <p>
                  हम बिना पूर्व सूचना के सेवाओं को संशोधित या बंद कर सकते हैं।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. खाता समाप्ति
                </h2>
                <p>
                  शर्तों के उल्लंघन पर हम आपका खाता निलंबित या समाप्त कर सकते हैं।
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  9. संपर्क
                </h2>
                <p>
                  प्रश्नों के लिए:
                  <br />
                  <a href="mailto:support@studyai.app" className="text-purple-600 hover:underline">
                    support@studyai.app
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

export default TermsOfService;
