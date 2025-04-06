'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPetDisplayData } from '@/app/actions/pet';
import { getPetGifByHealth } from '@/models/pet.model';

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

  useEffect(() => {
    const loadPetData = async () => {
      try {
        setLoading(true);
        const data = await getPetDisplayData(groupId);
        setPetData(data);
      } catch (err) {
        console.error('Error loading pet data:', err);
        setError('Could not load pet data');
      } finally {
        setLoading(false);
      }
    };

    loadPetData();
    
    // Refresh pet data every 30 seconds
    const intervalId = setInterval(loadPetData, 30000);
    
    return () => clearInterval(intervalId);
  }, [groupId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-xs animate-pulse">
        <div className="h-40 bg-gray-200 rounded-md mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-2 bg-gray-200 rounded mb-4"></div>
        <div className="h-6 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !petData) {
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
    <div className="rounded-lg shadow-md p-4 w-full max-w-xs">
      
      <div className="relative h-40 w-full mb-4">
        <Image
          src={petData.imageUrl}
          alt="Team duck"
          fill
          className="object-contain"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = '/pet/duck_idle.gif';
          }}
        />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Health</span>
          <span>{petData.health}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`${getHealthBarColor(petData.health)} h-2.5 rounded-full`} 
            style={{ width: `${petData.health}%` }}
          ></div>
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium">Duck Status</p>
        <p className="text-xs text-gray-600">{getHealthDescription(petData.health)}</p>
      </div>
    </div>
  );
}
