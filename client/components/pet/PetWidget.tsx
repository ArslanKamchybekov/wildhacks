'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPetDisplayData } from '@/app/actions/pet';
import { PetMood } from '@/models/pet.model';

// Health bar colors based on health level
const getHealthBarColor = (health: number) => {
  if (health > 70) return 'bg-green-500';
  if (health > 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Mood descriptions
const MOOD_DESCRIPTIONS: Record<PetMood, string> = {
  'happy': 'Your pet is happy and thriving!',
  'excited': 'Your pet is excited and energetic!',
  'neutral': 'Your pet is feeling okay.',
  'sleepy': 'Your pet is feeling a bit tired.',
  'angry': 'Your pet is upset with the lack of focus.',
  'sad': 'Your pet is sad and needs more attention.'
};

interface PetWidgetProps {
  groupId: string;
}

export default function PetWidget({ groupId }: PetWidgetProps) {
  const [petData, setPetData] = useState<{
    petId: string;
    health: number;
    mood: PetMood;
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
    <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-xs">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">Team Pet</h3>
      </div>
      
      <div className="relative h-40 w-full mb-4">
        <Image
          src={petData.imageUrl}
          alt={`Pet in ${petData.mood} mood`}
          fill
          className="object-contain"
          onError={(e) => {
            // Fallback if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = '/gemini.png';
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
        <p className="text-sm font-medium">Current Mood: <span className="font-bold capitalize">{petData.mood}</span></p>
        <p className="text-xs text-gray-600">{MOOD_DESCRIPTIONS[petData.mood]}</p>
      </div>
    </div>
  );
}
