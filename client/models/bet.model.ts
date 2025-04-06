import mongoose, { Schema, model, models } from "mongoose";

// Minimal Bet schema
const betSchema = new Schema(
  {
    userId: {
      type: String, // or Schema.Types.ObjectId if you store actual ObjectIds
      required: true,
    },
    betAmount: {
      type: Number,
      required: true,
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["authorized", "captured", "canceled", "failed"],
      default: "authorized",
    },
  },
  {
    timestamps: true, // automatically manage createdAt, updatedAt
  }
);

// Prevent model overwrite in watch mode or serverless re-deploy
export const Bet = models.Bet || model("Bet", betSchema);
