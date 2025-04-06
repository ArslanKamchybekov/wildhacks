'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addMemberToGroup, removeMemberFromGroup } from '@/app/actions/group';
import { UserPlus, UserMinus, Mail, AlertCircle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MemberManagementProps {
  groupId: string;
  members: string[];
  currentUserEmail: string;
  isCreator: boolean;
  onMembersChange: () => void;
}

export default function MemberManagement({ 
  groupId, 
  members, 
  currentUserEmail,
  isCreator,
  onMembersChange 
}: MemberManagementProps) {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (members.includes(newMemberEmail)) {
      setErrorMessage('This user is already a member of the team');
      return;
    }

    try {
      setIsAddingMember(true);
      setErrorMessage('');
      // Pass the current user's email as the inviter
      await addMemberToGroup(groupId, newMemberEmail, currentUserEmail);
      setNewMemberEmail('');
      setShowAddDialog(false);
      onMembersChange();
    } catch (error) {
      console.error('Error adding member:', error);
      setErrorMessage('Failed to add member. Please try again.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (email === currentUserEmail && !isCreator) {
      setErrorMessage('You cannot remove yourself from the team');
      return;
    }

    try {
      setIsRemovingMember(true);
      setErrorMessage('');
      await removeMemberFromGroup(groupId, email);
      setMemberToRemove(null);
      onMembersChange();
    } catch (error) {
      console.error('Error removing member:', error);
      setErrorMessage('Failed to remove member. Please try again.');
    } finally {
      setIsRemovingMember(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Team Members</h3>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              <span>Add Member</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Enter the email address of the person you want to add to your team.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Input
                placeholder="Email address"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                type="email"
              />
              {errorMessage && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errorMessage}
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={isAddingMember}>
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-2">
        {members.map((email) => (
          <div key={email} className="flex items-center justify-between p-2 rounded-md">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className={email === currentUserEmail ? 'font-medium' : ''}>
                {email} {email === currentUserEmail && '(You)'}
              </span>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    disabled={
                      (email === currentUserEmail && !isCreator) || 
                      isRemovingMember || 
                      (memberToRemove === email && isRemovingMember)
                    }
                    onClick={() => setMemberToRemove(email)}
                  >
                    <UserMinus className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remove from team</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </div>
      
      {/* Confirmation Dialog for Member Removal */}
      <Dialog 
        open={memberToRemove !== null} 
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToRemove} from the team?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              disabled={isRemovingMember}
            >
              {isRemovingMember ? 'Removing...' : 'Remove Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
