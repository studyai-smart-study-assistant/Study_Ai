
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Camera, 
  FileText, 
  Search,
  BookOpen,
  Scan,
  Download,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  type: 'document' | 'image' | 'note';
  extractedText: string;
  tags: string[];
  uploadDate: string;
  size: string;
}

const SmartContentLibrary: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Mathematics Chapter 5',
      type: 'document',
      extractedText: 'Quadratic equations और उनके solutions के बारे में detailed notes...',
      tags: ['Math', 'Algebra', 'Class 10'],
      uploadDate: '2024-12-28',
      size: '2.3 MB'
    },
    {
      id: '2',
      title: 'Physics Formula Sheet',
      type: 'image',
      extractedText: 'Newton के laws, Motion equations, Energy conservation...',
      tags: ['Physics', 'Formulas', 'Class 11'],
      uploadDate: '2024-12-27',
      size: '1.8 MB'
    }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const simulateOCR = async (file: File): Promise<string> => {
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `Extracted text from ${file.name}: यह एक sample text है जो OCR से extract हुआ है। इसमें mathematical formulas और diagrams की जानकारी है।`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setUploadProgress(0);

    for (const file of Array.from(files)) {
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const extractedText = await simulateOCR(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);

        const newItem: ContentItem = {
          id: Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          type: file.type.startsWith('image/') ? 'image' : 'document',
          extractedText,
          tags: ['Auto-tagged', 'OCR'],
          uploadDate: new Date().toISOString().split('T')[0],
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
        };

        setContentItems(prev => [newItem, ...prev]);
        toast.success(`✅ "${file.name}" successfully processed with OCR!`);
      } catch (error) {
        toast.error(`❌ Error processing ${file.name}`);
      }
    }

    setIsProcessing(false);
    setUploadProgress(0);
  };

  const filteredItems = contentItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.extractedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <BookOpen className="h-5 w-5" />
            Smart Content Library
            <Badge className="bg-blue-100 text-blue-800">OCR Enabled</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload Files</TabsTrigger>
              <TabsTrigger value="camera">Camera Scan</TabsTrigger>
              <TabsTrigger value="library">My Library</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Documents या Images</h3>
                <p className="text-sm text-gray-600 mb-4">
                  OCR automatically extract करेगा text content और search करने योग्य बनाएगा
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Scan className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm">Processing with OCR...</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Live Camera Scanning</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Directly capture documents या notes और instantly OCR करें
                </p>
                <Button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Open Camera
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </TabsContent>

            <TabsContent value="library" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search in your content library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Badge variant="outline">{filteredItems.length} items</Badge>
              </div>

              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <h4 className="font-medium">{item.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {item.extractedText}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{item.uploadDate}</span>
                            <span>{item.size}</span>
                            <div className="flex gap-1">
                              {item.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartContentLibrary;
