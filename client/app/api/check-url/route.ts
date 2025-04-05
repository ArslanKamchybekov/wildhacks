import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/user.model';
import Group from '@/models/group.model';
import Pet from '@/models/pet.model';

// List of known productive domains for common activities
const PRODUCTIVE_DOMAINS: Record<string, string[]> = {
  'learning': [
    'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org', 'freecodecamp.org',
    'github.com', 'stackoverflow.com', 'developer.mozilla.org', 'w3schools.com',
    'docs.google.com', 'medium.com', 'dev.to', 'youtube.com/watch?v=', 'youtube.com/playlist'
  ],
  'productivity': [
    'notion.so', 'trello.com', 'asana.com', 'todoist.com', 'evernote.com',
    'calendar.google.com', 'docs.google.com', 'sheets.google.com', 'drive.google.com',
    'clickup.com', 'monday.com', 'linear.app', 'figma.com'
  ],
  'fitness': [
    'strava.com', 'myfitnesspal.com', 'fitbit.com', 'nike.com', 'runtastic.com',
    'mapmyrun.com', 'garmin.com', 'youtube.com/watch?v='
  ],
  'reading': [
    'goodreads.com', 'kindle.amazon.com', 'audible.com', 'scribd.com', 'medium.com',
    'news.ycombinator.com', 'reddit.com/r/books', 'reddit.com/r/science'
  ]
};

// List of commonly unproductive domains
const UNPRODUCTIVE_DOMAINS = [
  'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com', 'reddit.com',
  'netflix.com', 'hulu.com', 'disneyplus.com', 'amazon.com', 'ebay.com',
  'buzzfeed.com', 'pinterest.com', 'snapchat.com', 'tumblr.com'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, userId, goals } = body;

    if (!url || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Extract domain from URL
    const domain = extractDomain(url);
    
    // Check if URL is productive based on goals
    const result = checkProductivity(domain, goals);
    
    // If the URL is not productive, update pet health
    if (!result.isProductive) {
      await updatePetHealth(userId);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking URL productivity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    // If URL is invalid, return the original string
    return url;
  }
}

// Check if URL is productive based on goals
function checkProductivity(domain: string, goals: string[]): { isProductive: boolean; message: string } {
  // If no goals provided, use a default check
  if (!goals || goals.length === 0) {
    const isUnproductive = UNPRODUCTIVE_DOMAINS.some(unproductiveDomain => 
      domain.includes(unproductiveDomain)
    );
    
    if (isUnproductive) {
      return {
        isProductive: false,
        message: 'This site might distract you from your goals.'
      };
    }
    
    // Check if it's in any productive category
    for (const category in PRODUCTIVE_DOMAINS) {
      const isProductive = PRODUCTIVE_DOMAINS[category].some(productiveDomain => 
        domain.includes(productiveDomain)
      );
      
      if (isProductive) {
        return {
          isProductive: true,
          message: `This site is good for ${category}!`
        };
      }
    }
    
    // If not found in any list, assume neutral
    return {
      isProductive: true,
      message: 'This site seems neutral for productivity.'
    };
  }
  
  // Check against user goals
  for (const goal of goals) {
    const lowerGoal = goal.toLowerCase();
    
    // Determine which category this goal might fall into
    let relevantCategory = '';
    if (lowerGoal.includes('learn') || lowerGoal.includes('study') || lowerGoal.includes('course')) {
      relevantCategory = 'learning';
    } else if (lowerGoal.includes('work') || lowerGoal.includes('project') || lowerGoal.includes('task')) {
      relevantCategory = 'productivity';
    } else if (lowerGoal.includes('exercise') || lowerGoal.includes('workout') || lowerGoal.includes('run')) {
      relevantCategory = 'fitness';
    } else if (lowerGoal.includes('read') || lowerGoal.includes('book')) {
      relevantCategory = 'reading';
    }
    
    if (relevantCategory && PRODUCTIVE_DOMAINS[relevantCategory]) {
      const isProductive = PRODUCTIVE_DOMAINS[relevantCategory].some(productiveDomain => 
        domain.includes(productiveDomain)
      );
      
      if (isProductive) {
        return {
          isProductive: true,
          message: `This site helps with your goal: ${goal}`
        };
      }
    }
    
    // Check if the domain contains keywords from the goal
    const goalWords = lowerGoal.split(' ').filter(word => word.length > 3);
    for (const word of goalWords) {
      if (domain.includes(word)) {
        return {
          isProductive: true,
          message: `This site seems related to your goal: ${goal}`
        };
      }
    }
  }
  
  // Check if it's in the unproductive list
  const isUnproductive = UNPRODUCTIVE_DOMAINS.some(unproductiveDomain => 
    domain.includes(unproductiveDomain)
  );
  
  if (isUnproductive) {
    return {
      isProductive: false,
      message: 'This site might distract you from your goals.'
    };
  }
  
  // If not found in any list, assume neutral
  return {
    isProductive: true,
    message: 'This site seems neutral for your goals.'
  };
}

// Update pet health when user visits unproductive sites
async function updatePetHealth(userId: string) {
  try {
    await connectToDatabase();
    
    // Find user to get their group
    const user = await User.findById(userId);
    if (!user) return;
    
    // Find user's group
    const group = await Group.findOne({ members: { $in: [userId] } });
    if (!group || !group.petId) return;
    
    // Update pet health
    const pet = await Pet.findById(group.petId);
    if (!pet) return;
    
    // Decrease health by 5, ensuring it doesn't go below 0
    pet.health = Math.max(0, pet.health - 5);
    await pet.save();
  } catch (error) {
    console.error('Error updating pet health:', error);
  }
}
