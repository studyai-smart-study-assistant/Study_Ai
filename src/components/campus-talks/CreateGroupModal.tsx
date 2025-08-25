import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, UserPlus, Camera, Trash2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  // Mock users data
  const availableUsers = [
    { id: '1', name: 'आरव शर्मा', avatar: '/api/placeholder/40/40', status: 'online' },
    { id: '2', name: 'दिव्या पटेल', avatar: '/api/placeholder/40/40', status: 'offline' },
    { id: '3', name: 'रोहित कुमार', avatar: '/api/placeholder/40/40', status: 'online' },
    { id: '4', name: 'प्रिया गुप्ता', avatar: '/api/placeholder/40/40', status: 'away' },
    { id: '5', name: 'अमित सिंह', avatar: '/api/placeholder/40/40', status: 'online' },
  ];

  const avatarColors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-red-500', 'bg-purple-500', 'bg-pink-500', 
    'bg-teal-500', 'bg-orange-500'
  ];

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedUsers.size === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setIsCreating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Group created successfully!');
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedAvatar(null);
    setSelectedUsers(new Set());
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 border-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-gray-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              प्रोफाइल एडिट करें
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-white/20 dark:hover:bg-gray-800/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="max-h-[calc(90vh-140px)]">
            <div className="p-4 space-y-6">
              {/* Profile Photo Section */}
              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                  प्रोफाइल फोटो
                </h3>
                
                <div className="relative inline-block">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={selectedAvatar || '/api/placeholder/80/80'} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-2xl">
                      {groupName ? getInitials(groupName) : <Users className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Photo Actions */}
                  <div className="flex justify-center space-x-2 mt-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full bg-green-500 hover:bg-green-600 text-white border-0"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full bg-red-500 hover:bg-red-600 text-white border-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Color Options */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    प्रोफाइल रंग
                  </h4>
                  <div className="flex justify-center space-x-2 flex-wrap">
                    {avatarColors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAvatar(null)}
                        className={`w-8 h-8 rounded-full ${color} border-2 ${
                          selectedAvatar === null && index === 0 
                            ? 'border-gray-900 dark:border-gray-100' 
                            : 'border-gray-300 dark:border-gray-600'
                        } hover:scale-110 transition-transform`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Group Name */}
              <div>
                <Label htmlFor="group-name" className="text-gray-900 dark:text-gray-100">
                  नाम
                </Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ajit Kumar"
                  className="mt-1 bg-white/70 dark:bg-gray-800/70"
                />
              </div>

              {/* Group Description */}
              <div>
                <Label htmlFor="group-bio" className="text-gray-900 dark:text-gray-100">
                  बायो
                </Label>
                <Textarea
                  id="group-bio"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Hey there I am using Educhat"
                  className="mt-1 bg-white/70 dark:bg-gray-800/70 min-h-[80px]"
                />
              </div>

              {/* Status Options */}
              <div>
                <Label className="text-gray-900 dark:text-gray-100 mb-3 block">
                  स्टेटस
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'उपलब्ध', color: 'bg-green-500', selected: true },
                    { label: 'व्यस्त', color: 'bg-red-500', selected: false },
                    { label: 'दूर', color: 'bg-yellow-500', selected: false },
                    { label: 'ऑफलाइन', color: 'bg-gray-500', selected: false }
                  ].map((status, index) => (
                    <button
                      key={index}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                        status.selected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {status.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Fields */}
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-900 dark:text-gray-100">
                    स्थान
                  </Label>
                  <Input
                    placeholder="Bhalpatti Darbhanga"
                    className="mt-1 bg-white/70 dark:bg-gray-800/70"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-gray-100">
                    काम/पेशा
                  </Label>
                  <Input
                    placeholder="Devloper"
                    className="mt-1 bg-white/70 dark:bg-gray-800/70"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-gray-100">
                    वेबसाइट
                  </Label>
                  <Input
                    placeholder="https://study-ai-29.lovable.app"
                    className="mt-1 bg-white/70 dark:bg-gray-800/70"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-gray-100">
                    जन्मतिथि
                  </Label>
                  <Input
                    type="date"
                    defaultValue="2008-05-05"
                    className="mt-1 bg-white/70 dark:bg-gray-800/70"
                  />
                </div>

                <div>
                  <Label className="text-gray-900 dark:text-gray-100">
                    रुचियां
                  </Label>
                  <Textarea
                    placeholder="work on website/Application creating"
                    className="mt-1 bg-white/70 dark:bg-gray-800/70"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-300 dark:border-gray-600"
                  disabled={isCreating}
                >
                  रद्द करें
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={isCreating || !groupName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                >
                  {isCreating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    '💾'
                  )}
                  {isCreating ? 'Creating...' : 'सेव करें'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;