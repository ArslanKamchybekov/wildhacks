import { connectToDatabase } from '@/lib/db';
import GeminiRoast from '@/models/gemini-roast.model';

/**
 * Get roasts by target user ID
 */
export async function getRoastsByTargetUser(userId: string) {
  try {
    await connectToDatabase();
    
    const roasts = await GeminiRoast.find({ target_user_id: userId })
      .sort({ created_at: -1 }) // Most recent first
      .limit(15); // Limit to last 15 roasts
      
    return roasts.map(roast => ({
      id: roast._id.toString(),
      content: roast.roast_content,
      level: roast.roast_level,
      groupId: roast.group_id,
      createdAt: roast.created_at
    }));
  } catch (error) {
    console.error('Error fetching roasts by user:', error);
    return [];
  }
}

/**
 * Get roast stats for a user
 */
export async function getUserRoastStats(userId: string) {
  try {
    await connectToDatabase();
    
    const totalRoasts = await GeminiRoast.countDocuments({ target_user_id: userId });
    
    // Get average roast level
    const roasts = await GeminiRoast.find({ target_user_id: userId });
    let totalLevel = 0;
    roasts.forEach(roast => {
      totalLevel += roast.roast_level || 5;
    });
    const averageLevel = totalRoasts > 0 ? Math.round((totalLevel / totalRoasts) * 10) / 10 : 0;
    
    // Get roasts by date for the last 7 days
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    const roastsByDate = await GeminiRoast.aggregate([
      { 
        $match: { 
          target_user_id: userId,
          created_at: { $gte: weekAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return {
      totalRoasts,
      averageLevel,
      roastsByDate: roastsByDate.map(item => ({
        date: item._id,
        count: item.count
      }))
    };
  } catch (error) {
    console.error('Error fetching roast stats:', error);
    return { totalRoasts: 0, averageLevel: 0, roastsByDate: [] };
  }
}
