import mongoose, { model, models, Schema } from "mongoose";

const OrderItemSchema = new Schema({
    productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    properties: { type: Object, default: {} },
    image: String
}, { _id: true });

const OrderSchema = new Schema({
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    address2: String,
    state: String,
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: { type: String, required: true },
    notes: String,
    shippingCost: { type: Number, default: 20 },
    paid: { type: Boolean, default: false },
    paymentId: String,
    viewed: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
        default: 'pending' 
    }
}, {
    timestamps: true,
    // إضافة هذا لضمان أن التحديثات تعمل بشكل صحيح
    strict: true,
    // تفعيل versioning للتأكد من التحديثات
    versionKey: '__v'
});

// إضافة index على الحقول المهمة
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paid: 1 });

// إضافة pre-save middleware للتشخيص
OrderSchema.pre('save', function(next) {
    console.log('Order pre-save middleware:', {
        id: this._id,
        status: this.status,
        isModified: this.isModified('status')
    });
    next();
});

// إضافة post-save middleware للتأكيد
OrderSchema.post('save', function(doc) {
    console.log('Order saved successfully:', {
        id: doc._id,
        status: doc.status
    });
});

export const Order = models?.Order || model('Order', OrderSchema);