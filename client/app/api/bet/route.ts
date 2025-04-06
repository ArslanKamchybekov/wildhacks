import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db"; // your own DB connection
import { Bet } from "@/models/bet.model"; // the Mongoose model from above

export async function POST(request: NextRequest) {
  try {
    // 1. Connect to DB
    await connectToDatabase();

    // 2. Get data from request body
    const { userId, betAmount, paymentIntentId } = await request.json();

    if (!userId || !betAmount || !paymentIntentId) {
      throw new Error("Missing required fields.");
    }

    // 3. Create a bet record
    const bet = await Bet.create({
      userId,
      betAmount,
      paymentIntentId,
      status: "authorized", 
    });

    return NextResponse.json({ bet });
  } catch (error: any) {
    console.error("Error creating bet:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

