'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateGroup } from '@/app/actions/group';
import { Users, Info, Check } from 'lucide-react';

interface GroupInfoEditorProps {
  groupId: string;
  name: string;
  description: string;
  isCreator: boolean;
  onInfoChange: () => void;
}

export default function GroupInfoEditor({ 
  groupId, 
  name, 
  description, 
  isCreator,
  onInfoChange 
}: GroupInfoEditorProps) {
  const [groupName, setGroupName] = useState(name);
  const [groupDescription, setGroupDescription] = useState(description);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    if (!groupName.trim()) {
      return;
    }

    try {
      setIsUpdating(true);
      await updateGroup(groupId, {
        name: groupName,
        description: groupDescription
      });
      setUpdateStatus('success');
      setIsEditing(false);
      onInfoChange();
      
      // Reset status after a delay
      setTimeout(() => {
        setUpdateStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error updating group info:', error);
      setUpdateStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setGroupName(name);
    setGroupDescription(description);
    setIsEditing(false);
    setUpdateStatus('idle');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Team Information</h3>
        </div>
        
        {!isEditing && isCreator && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="group-name" className="text-sm font-medium">
              Team Name
            </label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter team name"
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="group-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="group-description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Enter team description"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isUpdating || !groupName.trim() || (groupName === name && groupDescription === description)}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Team Name</h4>
            <p className="text-lg font-medium">{name}</p>
          </div>
          
          {description ? (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="text-sm">{description}</p>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>{isCreator ? 'No description added yet. Click Edit to add one.' : 'No description available.'}</span>
            </div>
          )}
          
          {updateStatus === 'success' && (
            <div className="text-sm text-green-500 flex items-center gap-1">
              <Check className="h-3 w-3" />
              <span>Team information updated successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
