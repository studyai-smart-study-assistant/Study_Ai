
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  name?: string;
  photoURL?: string;
  level?: number;
}

interface UserListProps {
  users: User[];
  selectedUsers: {[key: string]: boolean};
  onToggleUser: (userId: string) => void;
  emptyMessage?: string;
}

const UserList: React.FC<UserListProps> = ({
  users,
  selectedUsers,
  onToggleUser,
  emptyMessage = "No users available"
}) => {
  return (
    <div className="max-h-60 overflow-auto border rounded-md p-2 space-y-2">
      {users.length > 0 ? (
        users.map((user) => (
          <div key={user.id} className="flex items-center space-x-2">
            <Checkbox 
              id={`user-${user.id}`}
              checked={!!selectedUsers[user.id]}
              onCheckedChange={() => onToggleUser(user.id)}
            />
            <Label 
              htmlFor={`user-${user.id}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-xs shrink-0 overflow-hidden">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.name || 'User'} 
                    className="w-full h-full rounded-full object-cover" 
                  />
                ) : (
                  (user.name || 'U').charAt(0)
                )}
              </div>
              <span>{user.name || 'Unknown User'} {user.level ? `(Level ${user.level})` : ''}</span>
            </Label>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 py-2">{emptyMessage}</p>
      )}
    </div>
  );
};

export default UserList;
