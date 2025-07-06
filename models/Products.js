import mongoose, { model, Schema, models } from "mongoose";

const ProductSchema = new Schema({
    title: {type: String, required: true},
    slug: {type: String, unique: true, sparse: true},
    description: String,
    variants: [{
      properties: {type: Object},
      price: {type: Number, required: true},
      cost: {type: Number, required: true},
      stock: {type: Number, required: true}, // تغيير من Object إلى Number
    }],
    images: [{type: String}],
    category: {type: mongoose.Types.ObjectId, ref: 'Category'},
    properties: {type: Object},
    tags: [{ type: String }],
  }, {
    timestamps: true,
  });
  

  function createSlug(title) {
    let slug = title
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug;
}


ProductSchema.pre('save', async function(next) {
    if (this.title && (!this.slug || this.isModified('title'))) {
        let baseSlug = createSlug(this.title);
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
            const existingProduct = await this.constructor.findOne({ 
                slug: slug,
                _id: { $ne: this._id }
            });
            
            if (!existingProduct) {
                this.slug = slug;
                break;
            }
            
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
    next();
});

export const Product = models?.Product || model('Product', ProductSchema);
