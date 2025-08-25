
import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { app } from '@/lib/firebase/config';

class RemoteConfigService {
  private remoteConfig;
  private isInitialized = false;

  constructor() {
    this.remoteConfig = getRemoteConfig(app);
    this.setupDefaults();
  }

  private setupDefaults() {
    this.remoteConfig.settings = {
      minimumFetchIntervalMillis: 3600000, // 1 hour
      fetchTimeoutMillis: 60000, // 1 minute
    };

    // Default values
    this.remoteConfig.defaultConfig = {
      'notes_how_to_guide': JSON.stringify({
        title: "परफेक्ट नोट्स कैसे बनाएं",
        steps: [
          "📝 विषय स्पष्ट रूप से लिखें (जैसे: 'प्रकाश संश्लेषण', 'द्विघात समीकरण')",
          "📚 सब्जेक्ट और क्लास जरूर भरें (जैसे: जीव विज्ञान, कक्षा 10)",
          "📖 अध्याय का नाम दें अगर specific topic है",
          "🎯 नोट्स का फॉर्मेट चुनें: संक्षिप्त (Quick Review), विस्तृत (Detailed), या परीक्षा (Exam Focus)",
          "🌐 भाषा चुनें: हिंदी, अंग्रेजी या मिक्स्ड",
          "💡 अतिरिक्त आवश्यकताएं लिखें जैसे: 'उदाहरण चाहिए', 'फॉर्मूला focus करें'"
        ],
        tips: [
          "🔥 बेहतर परिणाम के लिए specific topic दें",
          "⚡ Quick Templates का उपयोग करें तेज़ी के लिए",
          "🎨 विभिन्न formats try करें अपनी जरूरत के अनुसार"
        ]
      }),
      'notes_error_messages': JSON.stringify({
        topic_required: "कृपया नोट्स के लिए विषय दर्ज करें",
        generation_failed: "नोट्स बनाने में समस्या हुई, कृपया फिर से कोशिश करें",
        network_error: "नेटवर्क की समस्या है, कृपया अपना कनेक्शन चेक करें"
      })
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await fetchAndActivate(this.remoteConfig);
      this.isInitialized = true;
      console.log('Remote Config initialized successfully');
    } catch (error) {
      console.error('Remote Config initialization failed:', error);
      this.isInitialized = true; // Use defaults
    }
  }

  getNotesGuide() {
    try {
      const value = getValue(this.remoteConfig, 'notes_how_to_guide').asString();
      return JSON.parse(value);
    } catch (error) {
      console.error('Error getting notes guide:', error);
      return this.remoteConfig.defaultConfig['notes_how_to_guide'] ? 
        JSON.parse(this.remoteConfig.defaultConfig['notes_how_to_guide'] as string) : null;
    }
  }

  getErrorMessages() {
    try {
      const value = getValue(this.remoteConfig, 'notes_error_messages').asString();
      return JSON.parse(value);
    } catch (error) {
      console.error('Error getting error messages:', error);
      return this.remoteConfig.defaultConfig['notes_error_messages'] ? 
        JSON.parse(this.remoteConfig.defaultConfig['notes_error_messages'] as string) : {};
    }
  }

  async refreshConfig() {
    try {
      await fetchAndActivate(this.remoteConfig);
      console.log('Remote Config refreshed');
    } catch (error) {
      console.error('Error refreshing Remote Config:', error);
    }
  }
}

export const remoteConfigService = new RemoteConfigService();
