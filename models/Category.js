import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    parent: { type: mongoose.Types.ObjectId, ref: 'Category' },
    properties: [{ type: Object }],
    tags: [{ type: String }],
    image: { type: String }
}, {
    timestamps: true
});

function createSlug(name) {
    const slug = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
    return slug || name; // إرجاع الاسم الأصلي إذا كان الslug فارغاً
}

CategorySchema.pre('validate', async function(next) {
    if (this.name && (!this.slug || this.isModified('name'))) {
        let baseSlug = createSlug(this.name);
        let slug = baseSlug;
        let counter = 1;
        
        // التحقق من وجود slug مماثل
        while (true) {
            const existingCategory = await this.constructor.findOne({ 
                slug: slug, 
                _id: { $ne: this._id } 
            });
            
            if (!existingCategory) {
                this.slug = slug;
                break;
            }
            
            // إضافة رقم للslug إذا كان موجوداً مسبقاً
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
    next();
});


export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
