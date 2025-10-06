import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
const SubscriptionSchema = new Schema({
  stripeId: { type: String, required: true },
  subscriptionEndDate: { type: Date, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  refreshToken: string;
  subscription?: mongoose.Types.ObjectId;
  files: mongoose.Types.ObjectId[];

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshToken: { type: String },
  subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
  files: [{ type: Schema.Types.ObjectId, ref: "Metadata" }],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const metadataSchema = new Schema({
  name: { type: String, required: true },
  size: { type: Number, required: true },
  thumbnail: { type: String, required: true },
  original: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const User = mongoose.model("User", userSchema);
const Subscription = mongoose.model("Subscription", SubscriptionSchema);
const Metadata = mongoose.model("Metadata", metadataSchema);

export { User, Subscription, Metadata };
