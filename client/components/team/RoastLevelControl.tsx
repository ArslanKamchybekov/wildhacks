'use client';

import { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { updateGeminiRoastLevel } from '@/app/actions/group';
import { Flame } from 'lucide-react';

interface RoastLevelControlProps {
  groupId: string;
  initialLevel: number;
}

export default function RoastLevelControl({ groupId, initialLevel }: RoastLevelControlProps) {
  const [level, setLevel] = useState(initialLevel);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleLevelChange = (value: number[]) => {
    setLevel(value[0]);
    setUpdateStatus('idle');
  };

  const saveRoastLevel = async () => {
    try {
      setIsUpdating(true);
      await updateGeminiRoastLevel(groupId, level);
      setUpdateStatus('success');
    } catch (error) {
      console.error('Error updating roast level:', error);
      setUpdateStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get description based on level
  const getLevelDescription = (level: number) => {
    if (level <= 2) return 'Gentle';
    if (level <= 4) return 'Mild';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'Spicy';
    return 'Savage';
  };

  // Get color based on level
  const getLevelColor = (level: number) => {
    if (level <= 2) return 'text-blue-500';
    if (level <= 4) return 'text-green-500';
    if (level <= 6) return 'text-yellow-500';
    if (level <= 8) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${getLevelColor(level)}`} />
          <span className="font-medium">Gemini Roast Level</span>
        </div>
        <span className={`font-bold ${getLevelColor(level)}`}>
          {level} - {getLevelDescription(level)}
        </span>
      </div>
      
      <Slider
        defaultValue={[initialLevel]}
        max={10}
        min={1}
        step={1}
        onValueChange={handleLevelChange}
      />
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Gentle</span>
        <span>Moderate</span>
        <span>Savage</span>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={saveRoastLevel} 
          disabled={isUpdating || level === initialLevel}
          size="sm"
          variant={updateStatus === 'success' ? 'outline' : 'default'}
        >
          {isUpdating ? 'Saving...' : updateStatus === 'success' ? 'Saved!' : 'Save Level'}
        </Button>
      </div>
    </div>
  );
}
