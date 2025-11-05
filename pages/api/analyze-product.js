// pages/api/analyze-product.js

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageUrl, availableProperties, availableTags, categories } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY is not set');
            return res.status(500).json({ 
                error: 'Server configuration error: API key not found'
            });
        }

        console.log('🖼️ تحميل الصورة من:', imageUrl);

        // تحميل الصورة
        let imageResponse;
        try {
            imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error(`فشل تحميل الصورة: ${imageResponse.status}`);
            }
        } catch (fetchError) {
            console.error('❌ خطأ في تحميل الصورة:', fetchError);
            return res.status(400).json({ 
                error: 'فشل تحميل الصورة',
                details: fetchError.message 
            });
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        console.log('✅ تم تحويل الصورة إلى base64');

        // بناء معلومات الفئات (فقط الفرعية)
        let categoriesText = '';
        if (categories && categories.length > 0) {
            // فلترة الفئات الفرعية فقط (التي لها parent)
            const subCategories = categories.filter(cat => cat.parent);
            
            if (subCategories.length > 0) {
                categoriesText = '\n\n## الفئات الفرعية المتاحة (اختر منها فقط):\n';
                subCategories.forEach(cat => {
                    categoriesText += `- ${cat.name}\n`;
                });
                categoriesText += '\n⚠️ يجب اختيار فئة فرعية فقط. إذا لم تجد فئة مناسبة، اترك الحقل فارغاً.';
            } else {
                categoriesText = '\n\n⚠️ لا توجد فئات فرعية متاحة حالياً.';
            }
        }

        // بناء معلومات الخصائص
        let propertiesText = '';
        if (availableProperties && availableProperties.length > 0) {
            propertiesText = '\n\n## الخصائص المتاحة (IMPORTANT - استخدم فقط هذه القيم):\n';
            availableProperties.forEach(prop => {
                propertiesText += `\n**${prop.name}**: اختر قيمة واحدة فقط من: ${prop.values.join(' | ')}\n`;
            });
            propertiesText += '\n⚠️ يجب اختيار قيمة واحدة على الأقل من كل خاصية. لا تترك أي خاصية فارغة.';
        }

        // بناء معلومات العلامات
        let tagsText = '';
        if (availableTags && availableTags.length > 0) {
            tagsText = `\n\n## العلامات المرجعية المتاحة:\n${availableTags.join(' | ')}\n`;
            tagsText += '\nاختر من 4-8 علامات مناسبة من القائمة أعلاه فقط.';
        }

        const prompt = `أنت خبير في تحليل صور المنتجات. قم بتحليل هذه الصورة بدقة واستخراج المعلومات التالية:
${categoriesText}
${propertiesText}
${tagsText}

## المعلومات المطلوبة:

1. **اسم المنتج (name)**: اسم واضح ووصفي (مثل: "قميص سفاري رجالي أبيض" أو "بدلة رسمية للأولاد")

2. **الوصف (description)**: وصف تسويقي جذاب يتكون من 3-5 جمل يشمل:
   - وصف المنتج ومميزاته
   - المواد والجودة
   - المناسبات المناسبة للاستخدام
   - الراحة والأناقة

3. **الفئة (category)**: اختر الفئة الفرعية الأدق من القائمة أعلاه (استخدم الاسم كما هو بالضبط). إذا لم تجد فئة فرعية مناسبة، اترك الحقل فارغاً أو ضع null.

4. **المتغيرات (variants)**: 
   - أنشئ عدة متغيرات بنفس السعر مع اختلاف قيم الخصائص
   - مثال: إذا كان المنتج متوفر بـ 3 ألوان و 5 مقاسات، أنشئ 15 متغير (3×5)
   - كل متغير يجب أن يحتوي على قيمة واحدة من كل خاصية
   - مثال للصيغة:
   [
     {
       "properties": [{"name": "اللون", "value": "أبيض"}, {"name": "المقاس", "value": "M"}],
       "price": 150,
       "cost": 90,
       "stock": 10
     },
     {
       "properties": [{"name": "اللون", "value": "أبيض"}, {"name": "المقاس", "value": "L"}],
       "price": 150,
       "cost": 90,
       "stock": 10
     }
   ]

5. **السعر (price)**: 
   - قدّر سعر مناسب بالريال السعودي (نفس السعر لكل المتغيرات)
   - للملابس الرجالية العادية: 50-200 ريال
   - للملابس الفاخرة أو الرسمية: 150-500 ريال
   - للملابس الأطفال: 30-150 ريال

6. **التكلفة (cost)**: 
   - يجب أن تكون 50-60% من السعر (نفس التكلفة لكل المتغيرات)
   - مثال: إذا السعر 100 ريال، التكلفة تكون 50-60 ريال

7. **المخزون (stock)**: وزّع المخزون على المتغيرات (مثلاً: إذا كان المخزون الكلي 100، وهناك 10 متغيرات، اجعل كل متغير 10)

8. **العلامات (tags)**: اختر 5-7 علامات من القائمة المتاحة فقط

## تعليمات مهمة:
- استخدم فقط القيم الموجودة في القوائم أعلاه
- لا تخترع قيم جديدة
- أنشئ متغيرات متعددة بجميع التركيبات الممكنة للخصائص
- يجب أن تكون جميع المتغيرات بنفس السعر ونفس التكلفة
- وزّع المخزون بالتساوي على المتغيرات
- اختر فئة فرعية فقط، وليس فئة رئيسية

أعطني النتيجة بصيغة JSON فقط، بدون أي نص قبل أو بعد:

{
  "name": "اسم المنتج الكامل",
  "description": "وصف تفصيلي جذاب للمنتج...",
  "category": "اسم الفئة الفرعية بالضبط من القائمة أو null",
  "variants": [
    {
      "properties": [
        {"name": "اسم الخاصية", "value": "القيمة"}
      ],
      "price": 150,
      "cost": 90,
      "stock": 10
    }
  ],
  "tags": ["علامة1", "علامة2", "علامة3"]
}`;

        console.log('📤 إرسال الطلب إلى Gemini API...');

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: base64Image,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.2,
                        topK: 20,
                        topP: 0.8,
                        maxOutputTokens: 2048,
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error('❌ Gemini API Error:', errorData);
            return res.status(500).json({ 
                error: 'فشل تحليل الصورة مع Gemini',
                details: errorData
            });
        }

        const data = await geminiResponse.json();
        console.log('✅ استلام رد من Gemini');

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('❌ استجابة غير صحيحة:', data);
            return res.status(500).json({ 
                error: 'استجابة غير صحيحة من Gemini'
            });
        }

        const text = data.candidates[0].content.parts[0].text;
        console.log('📝 النص المستلم:', text);
        
        // استخراج JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const productData = JSON.parse(jsonMatch[0]);
                
                // التحقق من صحة البيانات
                if (!productData.variants || productData.variants.length === 0) {
                    // إنشاء متغير افتراضي إذا لم يتم إنشاء متغيرات
                    productData.variants = [{
                        properties: productData.properties || [],
                        price: productData.price || 100,
                        cost: productData.cost || 60,
                        stock: productData.stock || 50
                    }];
                }
                
                // التأكد من وجود قيم صحيحة للمتغيرات
                productData.variants = productData.variants.map(variant => ({
                    ...variant,
                    price: Number(variant.price) || 100,
                    cost: Number(variant.cost) || 60,
                    stock: Number(variant.stock) || 10
                }));
                
                console.log('✅ تم استخراج البيانات بنجاح:', productData);
                return res.status(200).json(productData);
            } catch (parseError) {
                console.error('❌ خطأ في تحليل JSON:', parseError);
                return res.status(500).json({ 
                    error: 'فشل تحليل JSON من استجابة الذكاء الاصطناعي',
                    rawText: text 
                });
            }
        } else {
            console.error('❌ لم يتم العثور على JSON');
            return res.status(500).json({ 
                error: 'لم يتم العثور على JSON في استجابة الذكاء الاصطناعي',
                rawText: text 
            });
        }
    } catch (error) {
        console.error('❌ خطأ عام:', error);
        return res.status(500).json({ 
            error: 'خطأ داخلي في الخادم',
            message: error.message
        });
    }
}