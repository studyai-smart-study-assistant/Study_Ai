
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Save, Download, Trash2 } from 'lucide-react';

interface StorageStatsProps {
  storageUsed: number;
  itemCount: number;
  onExportAll: () => void;
  onClearAll: () => void;
}

const StorageStats: React.FC<StorageStatsProps> = ({
  storageUsed,
  itemCount,
  onExportAll,
  onClearAll
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5 text-blue-600" />
          Browser Storage
          <Badge variant="outline">{itemCount} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Used: {storageUsed} KB</span>
            <span>Available: Browser की limit तक</span>
          </div>
          <Progress value={Math.min((storageUsed / 1000) * 100, 100)} className="h-2" />
          <div className="flex gap-2">
            <Button size="sm" onClick={onExportAll} disabled={itemCount === 0}>
              <Download className="h-3 w-3 mr-1" />
              Export All
            </Button>
            <Button size="sm" variant="destructive" onClick={onClearAll} disabled={itemCount === 0}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageStats;
