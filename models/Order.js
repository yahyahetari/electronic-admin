import mongoose, { model, models, Schema } from "mongoose";

const OrderSchema = new Schema({
  line_items: Object,
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  address2: { type: String },
  state: { type: String },
  city: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  paid: Boolean,
  viewed: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export const Order = models?.Order || model('Order', OrderSchema);
