
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, BookOpen, Clock, Eye, Trash2 } from 'lucide-react';

interface SavedContent {
  id: string;
  title: string;
  type: 'notes' | 'quiz' | 'plan';
  content: string;
  savedAt: string;
  subject: string;
  size: string;
}

interface ContentListProps {
  content: SavedContent[];
  onView: (item: SavedContent) => void;
  onRemove: (id: string) => void;
}

const ContentList: React.FC<ContentListProps> = ({ content, onView, onRemove }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'notes': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'quiz': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'plan': return <BookOpen className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Content</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {content.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              कोई saved content नहीं है।
            </p>
          ) : (
            content.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  {getTypeIcon(item.type)}
                  <div>
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{item.subject}</span>
                      <span>•</span>
                      <span>{item.size}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.savedAt}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onView(item)}>
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onRemove(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentList;
