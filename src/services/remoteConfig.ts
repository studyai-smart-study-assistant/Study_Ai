
// Remote config service using localStorage fallback (no Firebase dependency)

class RemoteConfigService {
  private isInitialized = false;
  private config: Record<string, any> = {};

  constructor() {
    this.setupDefaults();
  }

  private setupDefaults() {
    this.config = {
      'notes_how_to_guide': {
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
      },
      'notes_error_messages': {
        topic_required: "कृपया नोट्स के लिए विषय दर्ज करें",
        generation_failed: "नोट्स बनाने में समस्या हुई, कृपया फिर से कोशिश करें",
        network_error: "नेटवर्क की समस्या है, कृपया अपना कनेक्शन चेक करें"
      }
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Try to load from localStorage
      const savedConfig = localStorage.getItem('remote_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
      this.isInitialized = true;
      console.log('Remote Config initialized successfully');
    } catch (error) {
      console.error('Remote Config initialization failed:', error);
      this.isInitialized = true; // Use defaults
    }
  }

  getNotesGuide() {
    return this.config['notes_how_to_guide'];
  }

  getErrorMessages() {
    return this.config['notes_error_messages'] || {};
  }

  async refreshConfig() {
    // No-op since we're using local config
    console.log('Remote Config refreshed (using local config)');
  }
}

export const remoteConfigService = new RemoteConfigService();
