import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      //USER IS SUBSCRIBING TO THE CHANNEL
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      //CHANNEL IS SUBSCRIBED BY THE USER
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
