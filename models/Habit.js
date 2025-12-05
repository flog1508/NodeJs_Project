import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Le titre de l'habitude est obligatoire"],
  },
  description: String,
  frequency: {
    type: String,
    enum: ["daily", "weekly", "custom"],
    default: "daily",
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Habit = mongoose.model("Habit", habitSchema);