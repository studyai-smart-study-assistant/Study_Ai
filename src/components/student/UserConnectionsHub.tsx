import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, UserPlus, UserCheck, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { getLeaderboardData } from '@/lib/leaderboard/data-service';

interface UserConnectionsHubProps {
  currentUserId: string;
}

const UserConnectionsHub: React.FC<UserConnectionsHubProps> = ({ currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUsers();
    loadConnections();
  }, [currentUserId]);

  const loadUsers = async () => {
    try {
      const users = await getLeaderboardData();
      setAllUsers(users.filter(u => u.id !== currentUserId));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadConnections = () => {
    const connectionsKey = `${currentUserId}_connections`;
    const requestsKey = `${currentUserId}_pending_requests`;
    
    const savedConnections = localStorage.getItem(connectionsKey);
    const savedRequests = localStorage.getItem(requestsKey);
    
    if (savedConnections) {
      setConnections(new Set(JSON.parse(savedConnections)));
    }
    if (savedRequests) {
      setPendingRequests(new Set(JSON.parse(savedRequests)));
    }
  };

  const saveConnections = (newConnections: Set<string>) => {
    const key = `${currentUserId}_connections`;
    localStorage.setItem(key, JSON.stringify(Array.from(newConnections)));
    setConnections(newConnections);
  };

  const handleConnect = (userId: string) => {
    const newPending = new Set(pendingRequests);
    newPending.add(userId);
    setPendingRequests(newPending);
    
    const key = `${currentUserId}_pending_requests`;
    localStorage.setItem(key, JSON.stringify(Array.from(newPending)));
    
    toast.success('Connection request भेजा गया!');
  };

  const handleAccept = (userId: string) => {
    const newConnections = new Set(connections);
    newConnections.add(userId);
    saveConnections(newConnections);
    
    const newPending = new Set(pendingRequests);
    newPending.delete(userId);
    setPendingRequests(newPending);
    
    toast.success('Connection स्वीकार किया गया! 🎉');
  };

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedUsers = filteredUsers.filter(u => connections.has(u.id));
  const suggestedUsers = filteredUsers
    .filter(u => !connections.has(u.id) && !pendingRequests.has(u.id))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);

  const renderUserCard = (user: any, action: 'connect' | 'connected' | 'pending') => (
    <Card key={user.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{user.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">Level {user.level}</Badge>
                <span>#{user.rank}</span>
              </div>
            </div>
          </div>
          
          {action === 'connect' && (
            <Button size="sm" onClick={() => handleConnect(user.id)}>
              <UserPlus className="h-4 w-4 mr-1" />
              Connect
            </Button>
          )}
          {action === 'connected' && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-700">
              <UserCheck className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
          {action === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => handleAccept(user.id)}>
              Accept
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
          <div className="text-center">
            <div className="text-sm font-semibold">{user.xp}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold">{user.streakDays}🔥</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold">{user.studyHours}h</div>
            <div className="text-xs text-muted-foreground">Study</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Student Connections
          </CardTitle>
          <CardDescription>
            दूसरे students के साथ connect करें और एक-दूसरे को motivate करें
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Students खोजें..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">
            <TrendingUp className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="connections">
            <UserCheck className="h-4 w-4 mr-2" />
            Connections ({connections.size})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <UserPlus className="h-4 w-4 mr-2" />
            Requests ({pendingRequests.size})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Top Students</h3>
          <div className="grid gap-4">
            {suggestedUsers.map(user => renderUserCard(user, 'connect'))}
          </div>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Your Connections</h3>
          {connectedUsers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                अभी तक कोई connection नहीं है। Discover tab से connect करें!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {connectedUsers.map(user => renderUserCard(user, 'connected'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 mt-6">
          <h3 className="text-lg font-semibold">Pending Requests</h3>
          {pendingRequests.size === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                कोई pending requests नहीं हैं
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredUsers
                .filter(u => pendingRequests.has(u.id))
                .map(user => renderUserCard(user, 'pending'))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserConnectionsHub;
