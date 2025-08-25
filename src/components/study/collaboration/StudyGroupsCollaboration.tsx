
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  MessageCircle,
  Calendar,
  BookOpen,
  Video,
  Share2,
  Clock,
  MapPin,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string;
  members: number;
  maxMembers: number;
  isJoined: boolean;
  nextSession: string;
  activity: 'low' | 'medium' | 'high';
  type: 'public' | 'private';
  admin: string;
}

interface StudySession {
  id: string;
  title: string;
  groupName: string;
  date: string;
  time: string;
  duration: string;
  type: 'video' | 'chat' | 'collaborative';
  participants: number;
  topic: string;
  status: 'upcoming' | 'live' | 'completed';
}

const StudyGroupsCollaboration: React.FC = () => {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([
    {
      id: '1',
      name: 'JEE Mathematics Masters',
      description: 'Advanced mathematics concepts और problem solving के लिए group',
      subject: 'Mathematics',
      members: 45,
      maxMembers: 50,
      isJoined: true,
      nextSession: '2024-12-29 7:00 PM',
      activity: 'high',
      type: 'public',
      admin: 'Rahul Sir'
    },
    {
      id: '2',
      name: 'NEET Biology Study Circle',
      description: 'Biology topics की detailed discussion और doubt clearing',
      subject: 'Biology',
      members: 32,
      maxMembers: 40,
      isJoined: false,
      nextSession: '2024-12-30 6:00 PM',
      activity: 'medium',
      type: 'public',
      admin: 'Priya Ma\'am'
    },
    {
      id: '3',
      name: 'Class 12 Physics Hub',
      description: 'Physics formulas, numericals और concepts की practice',
      subject: 'Physics',
      members: 28,
      maxMembers: 35,
      isJoined: true,
      nextSession: '2024-12-28 8:00 PM',
      activity: 'high',
      type: 'public',
      admin: 'Amit Sir'
    }
  ]);

  const [studySessions, setStudySessions] = useState<StudySession[]>([
    {
      id: '1',
      title: 'Calculus Problem Solving',
      groupName: 'JEE Mathematics Masters',
      date: '2024-12-28',
      time: '7:00 PM',
      duration: '2 hours',
      type: 'video',
      participants: 25,
      topic: 'Integration Techniques',
      status: 'upcoming'
    },
    {
      id: '2',
      title: 'Cell Biology Discussion',
      groupName: 'NEET Biology Study Circle',
      date: '2024-12-29',
      time: '6:00 PM',
      duration: '1.5 hours',
      type: 'collaborative',
      participants: 18,
      topic: 'Cell Division & Genetics',
      status: 'upcoming'
    },
    {
      id: '3',
      title: 'Wave Mechanics Live Session',
      groupName: 'Class 12 Physics Hub',
      date: '2024-12-27',
      time: '8:00 PM',
      duration: '90 mins',
      type: 'video',
      participants: 22,
      topic: 'Sound & Light Waves',
      status: 'completed'
    }
  ]);

  const joinGroup = (groupId: string) => {
    setStudyGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, isJoined: true, members: group.members + 1 }
        : group
    ));
    toast.success('🎉 Successfully joined the study group!');
  };

  const leaveGroup = (groupId: string) => {
    setStudyGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, isJoined: false, members: group.members - 1 }
        : group
    ));
    toast.success('Left the study group');
  };

  const createGroup = () => {
    toast.success('🆕 New study group creation feature coming soon!');
  };

  const joinSession = (sessionId: string) => {
    toast.success('🎯 Joining study session...');
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Users className="h-5 w-5" />
              Study Groups & Collaboration
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </CardTitle>
            <Button 
              onClick={createGroup}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="groups">Study Groups</TabsTrigger>
          <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <div className="grid gap-4">
            {studyGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <Badge variant={group.type === 'public' ? 'default' : 'secondary'}>
                          {group.type}
                        </Badge>
                        <Badge variant={
                          group.activity === 'high' ? 'default' : 
                          group.activity === 'medium' ? 'secondary' : 'outline'
                        }>
                          {group.activity} activity
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{group.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span>{group.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span>{group.members}/{group.maxMembers} members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span>{group.nextSession}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>by {group.admin}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {group.isJoined ? (
                        <>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => leaveGroup(group.id)}
                          >
                            Leave
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => joinGroup(group.id)}
                          disabled={group.members >= group.maxMembers}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Join Group
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid gap-4">
            {studySessions.map((session) => (
              <Card key={session.id} className={`${session.status === 'live' ? 'border-red-300 bg-red-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{session.title}</h4>
                        <Badge className={
                          session.status === 'live' ? 'bg-red-100 text-red-800' :
                          session.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {session.status}
                        </Badge>
                        {session.type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                        {session.type === 'collaborative' && <Share2 className="h-4 w-4 text-green-500" />}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{session.groupName}</p>
                      <p className="text-sm font-medium mb-3">Topic: {session.topic}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {session.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {session.participants} participants
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {session.status === 'live' ? (
                        <Button 
                          size="sm" 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => joinSession(session.id)}
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Join Live
                        </Button>
                      ) : session.status === 'upcoming' ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => joinSession(session.id)}
                        >
                          Set Reminder
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-groups" className="space-y-4">
          <div className="grid gap-4">
            {studyGroups.filter(group => group.isJoined).map((group) => (
              <Card key={group.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                        {group.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-sm text-gray-600">{group.members} members • {group.subject}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyGroupsCollaboration;
