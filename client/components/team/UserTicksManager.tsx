'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clipboard, Plus, X, Edit, AlertCircle } from 'lucide-react';

// Import user actions to manage ticks
import { getUserTicks, addUserTick, removeUserTick } from '@/app/actions/tick';

interface TickData {
  id: string;
  content: string;
  addedBy: string;
  timestamp: string;
}

interface UserTicksManagerProps {
  groupMembers: string[];
  currentUserEmail: string;
}

export default function UserTicksManager({ 
  groupMembers,
  currentUserEmail 
}: UserTicksManagerProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userTicks, setUserTicks] = useState<TickData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTickContent, setNewTickContent] = useState('');
  const [isAddingTick, setIsAddingTick] = useState(false);
  const [isDeletingTick, setIsDeletingTick] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load user ticks when a user is selected
  useEffect(() => {
    if (selectedUser) {
      loadUserTicks(selectedUser);
    }
  }, [selectedUser]);

  const loadUserTicks = async (userEmail: string) => {
    try {
      setIsLoading(true);
      const ticks = await getUserTicks(userEmail);
      setUserTicks(ticks);
    } catch (error) {
      console.error('Error loading user ticks:', error);
      setUserTicks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTick = async () => {
    if (!selectedUser || !newTickContent.trim()) {
      setErrorMessage('Please enter a valid observation');
      return;
    }

    try {
      setIsAddingTick(true);
      setErrorMessage('');
      await addUserTick(selectedUser, {
        content: newTickContent,
        addedBy: currentUserEmail,
        timestamp: new Date().toISOString()
      });
      setNewTickContent('');
      setShowAddDialog(false);
      await loadUserTicks(selectedUser);
    } catch (error) {
      console.error('Error adding tick:', error);
      setErrorMessage('Failed to add tick. Please try again.');
    } finally {
      setIsAddingTick(false);
    }
  };

  const handleDeleteTick = async (tickId: string) => {
    if (!selectedUser) return;

    try {
      setIsDeletingTick(true);
      await removeUserTick(selectedUser, tickId);
      await loadUserTicks(selectedUser);
    } catch (error) {
      console.error('Error removing tick:', error);
    } finally {
      setIsDeletingTick(false);
    }
  };

  return (
    <div className="space-y-4">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {groupMembers.map((email) => (
          <Button
            key={email}
            variant={selectedUser === email ? "default" : "outline"}
            className="justify-start"
            onClick={() => setSelectedUser(email)}
          >
            {email === currentUserEmail ? `${email} (You)` : email}
          </Button>
        ))}
      </div>
      
      {selectedUser ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Observations for {selectedUser}</span>
              
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Tick</DialogTitle>
                    <DialogDescription>
                      Add a new tick about {selectedUser}.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <Input
                      placeholder="Enter your observation"
                      value={newTickContent}
                      onChange={(e) => setNewTickContent(e.target.value)}
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
                    <Button onClick={handleAddTick} disabled={isAddingTick}>
                      {isAddingTick ? 'Adding...' : 'Add Tick'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
            <CardDescription>
              These observations help Gemini generate personalized roasts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : userTicks.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p>No observations yet</p>
                <p className="text-sm">Add an observation to help Gemini generate better roasts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userTicks.map((tick) => (
                  <div key={tick.id} className="flex items-start justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <p className="text-sm">{tick.content}</p>
                      <p className="text-xs text-gray-500">
                        Added by {tick.addedBy === currentUserEmail ? 'you' : tick.addedBy} on {new Date(tick.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {(tick.addedBy === currentUserEmail) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500"
                        disabled={isDeletingTick}
                        onClick={() => handleDeleteTick(tick.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-6 text-gray-500">
            <p>Select a team member to view and manage observations</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
