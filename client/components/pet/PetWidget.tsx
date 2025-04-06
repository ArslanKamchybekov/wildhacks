'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getPetDisplayData } from '@/app/actions/pet';
import { useCurrentUser } from '@/hooks/use-current-user';
import { toast } from 'sonner';

// Health bar colors based on health level
const getHealthBarColor = (health: number) => {
  if (health > 70) return 'bg-green-500';
  if (health > 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Health state descriptions
const HEALTH_DESCRIPTIONS: Record<string, string> = {
  'high': 'Your duck is happy and thriving!',
  'medium': 'Your duck is doing okay.',
  'low': 'Your duck is feeling tired.',
  'critical': 'Your duck needs more attention!'
};

// Get health state description based on health value
const getHealthDescription = (health: number): string => {
  if (health > 80) return HEALTH_DESCRIPTIONS.high;
  if (health > 50) return HEALTH_DESCRIPTIONS.medium;
  if (health > 30) return HEALTH_DESCRIPTIONS.low;
  return HEALTH_DESCRIPTIONS.critical;
};

interface PetWidgetProps {
  groupId: string;
}

export default function PetWidget({ groupId }: PetWidgetProps) {
  const [petData, setPetData] = useState<{
    petId: string;
    health: number;
    imageUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dbUser } = useCurrentUser();
  const [petCaptured, setPetCaptured] = useState(false);
  // Track if we've already attempted to call the API
  const [apiCallAttempted, setApiCallAttempted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle pet death (when health reaches 0)
  const handlePetDeath = async () => {
    // If we've already captured the pet or attempted the API call, don't try again
    if (petCaptured || apiCallAttempted) {
      return;
    }
    
    try {
      // Mark as captured and API call attempted immediately to prevent further attempts
      setPetCaptured(true);
      setApiCallAttempted(true);
      
      console.log('Attempting to capture pet for user:', dbUser?._id);
      
      // Only make the API call if we have a user ID
      if (!dbUser?._id) {
        console.log('No user ID available, skipping API call');
        return;
      }
      
      const response = await fetch('/api/capture-bet-by-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: dbUser._id,
        }),
      });
      
      // Even if the response is not OK, we've already marked the pet as captured
      // This prevents further API calls
      if (response.ok) {
        toast.success('Pet captured successfully!');
      } else {
        console.error('API returned error, but pet remains captured');
        // Don't throw an error - we want to keep the pet captured state
      }
      
      // Clear the interval regardless of API response
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      console.error('Error capturing pet:', err);
      // Even on error, we keep the pet captured to prevent further API calls
      toast.error('Failed to capture bet, but pet remains captured');
      // Do NOT reset the captured state here
    }
  };

  useEffect(() => {
    const loadPetData = async () => {
      // Don't load data if pet is already captured
      if (petCaptured) return;
      
      try {
        setLoading(true);
        const data = await getPetDisplayData(groupId);
        setPetData(data);
        
        // Check if pet health has reached 0 and trigger capture
        // Only attempt if we haven't already tried the API call
        if (data && data.health <= 0 && !petCaptured && !apiCallAttempted) {
          await handlePetDeath();
        }
      } catch (err) {
        console.error('Error loading pet data:', err);
        setError('Could not load pet data');
      } finally {
        setLoading(false);
      }
    }

    // Initial load
    loadPetData();
    
    // Refresh pet data every 30 seconds if not captured
    if (!petCaptured) {
      intervalRef.current = setInterval(loadPetData, 30000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [groupId, petCaptured, dbUser]);

  if (loading && !petCaptured) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-xs animate-pulse">
        <div className="h-40 bg-gray-200 rounded-md mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-2 bg-gray-200 rounded mb-4"></div>
        <div className="h-6 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if ((error || !petData) && !petCaptured) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-xs">
        <div className="text-center text-red-500">
          <p>Could not load pet data</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4 w-full max-w-xs">
      
      <div className="relative h-40 w-full mb-4">
        <Image
          src={petCaptured ? '/pet/duckdeath.gif' : petData?.imageUrl || '/pet/duckidle.gif'}
          alt="Team duck"
          fill
          className="object-contain"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = '/pet/duckidle.gif';
          }}
        />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Health</span>
          <span>{petCaptured ? '0' : `${petData?.health || 0}%`}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`${petCaptured ? 'bg-red-500' : getHealthBarColor(petData?.health || 0)} h-2.5 rounded-full`} 
            style={{ width: petCaptured ? '0%' : `${Math.max(petData?.health || 0, 0)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium">Duck Status</p>
        <p className="text-xs text-gray-600">
          {petCaptured ? "Your duck has been captured!" : getHealthDescription(petData?.health || 0)}
        </p>
      </div>
    </div>
  );
}