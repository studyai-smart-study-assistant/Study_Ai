import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-xl text-primary font-medium">
              Study AI – Smart Learning Assistant
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: January 2026
            </p>
          </div>
          
          <ScrollArea className="h-[70vh]">
            <div className="space-y-8 text-gray-700 dark:text-gray-300 pr-4">
              
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  1. Purpose of the Application
                </h2>
                <p className="mb-3">
                  Study AI is an AI-powered educational learning assistant designed for students.
                  The app helps users ask questions, generate explanations, notes, quizzes, and learning-related content using artificial intelligence.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    Study AI is strictly an educational application.
                    It is not a financial, gambling, earning, investment, or entertainment app.
                  </p>
                </div>
              </section>

              <Separator />

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  2. Information We Collect
                </h2>
                <p className="mb-4">We collect only minimal and necessary data to operate and improve the app.</p>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">a) Personal Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Email address (only if the user chooses to log in)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">b) Usage Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Pages visited</li>
                      <li>Features used</li>
                      <li>General interaction data</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">c) Device Information</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Device type</li>
                      <li>Browser or system-related non-personal data</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  3. How We Use the Data
                </h2>
                <p className="mb-3">Collected data is used only to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Improve app functionality</li>
                  <li>Enhance learning experience</li>
                  <li>Maintain security and prevent misuse</li>
                  <li>Provide stable and reliable services</li>
                </ul>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4 border-l-4 border-green-500">
                  <p className="font-medium text-green-800 dark:text-green-300">
                    We do not sell, rent, or misuse user data under any circumstances.
                  </p>
                </div>
              </section>

              <Separator />

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  4. AI Usage Transparency
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Study AI uses artificial intelligence to generate responses based on user questions</li>
                  <li>User inputs (questions, prompts) are processed temporarily</li>
                  <li>AI-generated responses are provided only for educational assistance</li>
                  <li>There is no human review of individual user queries</li>
                  <li>AI responses should not be treated as professional or final advice</li>
                </ul>
              </section>

              <Separator />

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  5. Tokens and Points System
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tokens and points are virtual, in-app items</li>
                  <li>They have no real-world monetary value</li>
                  <li>Tokens are used only to access advanced features within the app</li>
                  <li>Points are used for activity tracking and leaderboard ranking</li>
                  <li className="font-medium text-orange-700 dark:text-orange-400">Tokens and points cannot be exchanged for real money</li>
                </ul>
              </section>

              <Separator />

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  6. Advertisements
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Study AI may display third-party advertisements</li>
                  <li>Ads help support development and keep the app free for students</li>
                  <li>Advertisements are non-intrusive and do not block core learning features</li>
                  <li>Clicking ads may redirect users to external websites</li>
                  <li>Study AI does not control or guarantee third-party ad content</li>
                </ul>
              </section>

              <Separator />

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  7. Third-Party Services
                </h2>
                <p className="mb-3">We may use third-party services for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>AI processing</li>
                  <li>Analytics</li>
                  <li>Advertising networks</li>
                </ul>
                <p className="mt-3 text-sm text-muted-foreground">
                  These services may have their own privacy policies. Study AI is not responsible for third-party data practices.
                </p>
              </section>

              <Separator />

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  8. Cookies and Tracking Technologies
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Third-party ad providers may use cookies or similar technologies</li>
                  <li>Cookies are used to show relevant advertisements</li>
                  <li>Study AI does not control third-party cookies or tracking behavior</li>
                </ul>
              </section>

              <Separator />

              {/* Section 9 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  9. Data Storage
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Minimal data is stored for authentication and app functionality</li>
                  <li>Generated notes or content may be stored locally on the user's device</li>
                  <li>No unnecessary data retention</li>
                </ul>
              </section>

              <Separator />

              {/* Section 10 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  10. Data Security
                </h2>
                <p>
                  We use reasonable security measures to protect user data.
                  However, no system is 100% secure, and absolute security cannot be guaranteed.
                </p>
              </section>

              <Separator />

              {/* Section 11 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  11. Children's Privacy
                </h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Study AI is intended for students</li>
                  <li>We do not knowingly collect sensitive personal data from children</li>
                  <li>The app does not knowingly collect data from children under the age of 9 without parental consent</li>
                  <li>Parental guidance is encouraged for younger users</li>
                </ul>
              </section>

              <Separator />

              {/* Section 12 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  12. Policy Updates
                </h2>
                <p>
                  This Privacy Policy may be updated to comply with platform policies or legal requirements.
                  Any changes will be reflected on this page.
                  Continued use of the app implies acceptance of the updated policy.
                </p>
              </section>

              <Separator />

              {/* Section 13 - Contact */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  13. Contact & Support
                </h2>
                <p className="mb-4">Users may contact us for support, feedback, or questions:</p>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href="mailto:ajit91884270@gmail.com" className="text-primary hover:underline">
                      ajit91884270@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <a href="tel:+919504797910" className="text-primary hover:underline">
                      +91-9504797910
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <a href="https://study-ai-001-41.lovable.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      https://study-ai-001-41.lovable.app
                    </a>
                  </div>
                </div>
              </section>

              <div className="pt-6 text-center text-sm text-muted-foreground">
                <p>© 2026 Study AI. All rights reserved.</p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
