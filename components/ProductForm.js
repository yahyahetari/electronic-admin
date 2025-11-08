import axios from "axios";
import { Trash2, Upload, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loader from "./Loader";
import { ReactSortable } from "react-sortablejs";

export default function ProductForm({
    _id,
    title: existingTitle,
    description: existingDescription,
    images: existingImages,
    category: existingCategory,
    properties: existingProperties,
    tags: existingTags,
    variants: existingVariants,
}) {
    const [title, setTitle] = useState(existingTitle || '');
    const [description, setDescription] = useState(existingDescription || '');
    const [category, setCategory] = useState(existingCategory || '');
    const [productProperties, setProductProperties] = useState(existingProperties || {});
    const [images, setImages] = useState(existingImages || []);
    const [categories, setCategories] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState(existingTags || []);
    const [variants, setVariants] = useState(existingVariants || []);
    const [isUploading, setIsUploading] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiError, setAiError] = useState('');
    const router = useRouter();
    const { page, ...rest } = router.query;

    useEffect(() => {
        async function fetchCategories() {
            const result = await axios.get('/api/categories');
            setCategories(result.data);
            updateTags(result.data, existingCategory);
        }
        fetchCategories();
    }, [existingCategory]);

    // دالة استخراج المعلومات بالذكاء الاصطناعي

async function analyzeImagesWithAI() {
    if (!images || images.length === 0) {
        setAiError('الرجاء رفع صورة واحدة على الأقل');
        setTimeout(() => setAiError(''), 3000);
        return;
    }

    // تحذير إذا لم يتم اختيار فئة
    if (!category) {
        const confirmWithoutCategory = confirm(
            '⚠️ لم تختر فئة للمنتج!\n\n' +
            'لأفضل النتائج، يُفضل اختيار الفئة أولاً حتى يتم تحديد الخصائص والعلامات المناسبة.\n\n' +
            'هل تريد المتابعة بدون فئة؟'
        );

        if (!confirmWithoutCategory) {
            return;
        }
    }

    setIsAnalyzing(true);
    setAiError('');

    try {
        console.log('📊 البيانات المرسلة:');
        console.log('- عدد الصور:', images.length);
        console.log('- الخصائص المتاحة:', propertiesArray);
        console.log('- العلامات المتاحة:', availableTags);
        console.log('- الفئات:', categories.map(c => c.name));

        // إرسال جميع الصور بدلاً من صورة واحدة
        const response = await axios.post('/api/analyze-product', {
            imageUrls: images, // إرسال جميع الصور
            availableProperties: propertiesArray.length > 0 ? propertiesArray : null,
            availableTags: availableTags.length > 0 ? availableTags : null,
            categories: categories.map(cat => ({
                _id: cat._id,
                name: cat.name,
                parent: cat.parent ? cat.parent._id : null
            }))
        });

        const productData = response.data;
        console.log('✅ البيانات المستلمة:', productData);

        // تطبيق اسم المنتج
        if (productData.name) {
            setTitle(productData.name);
        }

        // تطبيق الوصف
        if (productData.description) {
            setDescription(productData.description);
        }

        // البحث عن الفئة المطابقة (فقط الفئات الفرعية)
        if (productData.category && categories.length > 0) {
            const subCategories = categories.filter(cat => cat.parent);

            if (subCategories.length === 0) {
                console.log('⚠️ لا توجد فئات فرعية متاحة');
                alert('⚠️ تنبيه: لا توجد فئات فرعية متاحة\n\nيرجى إضافة فئة فرعية مناسبة للمنتج أولاً.');
            } else {
                let matchedCategory = subCategories.find(cat =>
                    cat.name.trim().toLowerCase() === productData.category.trim().toLowerCase()
                );

                if (!matchedCategory) {
                    matchedCategory = subCategories.find(cat => {
                        const catNameLower = cat.name.toLowerCase();
                        const productCategoryLower = productData.category.toLowerCase();
                        return catNameLower.includes(productCategoryLower) ||
                            productCategoryLower.includes(catNameLower);
                    });
                }

                if (matchedCategory) {
                    console.log('✅ تم العثور على الفئة الفرعية:', matchedCategory.name);
                    setCategory(matchedCategory._id);

                    setTimeout(() => {
                        updateTags(categories, matchedCategory._id);
                    }, 100);
                } else {
                    const availableSubCategories = subCategories.map(cat => `  • ${cat.name}`).join('\n');

                    console.log('⚠️ لم يتم العثور على فئة فرعية مطابقة:', productData.category);
                    alert(
                        `❌ لم يتم العثور على فئة فرعية مناسبة للمنتج\n\n` +
                        `الفئة المقترحة من الذكاء الاصطناعي: "${productData.category}"\n\n` +
                        `الفئات الفرعية المتاحة حالياً:\n${availableSubCategories}\n\n` +
                        `📝 يرجى من المسؤول إضافة فئة فرعية جديدة باسم "${productData.category}" أو اختيار فئة مناسبة يدوياً.`
                    );
                }
            }
        }

        // تطبيق المتغيرات المتعددة
        let validVariants = [];
        if (productData.variants && productData.variants.length > 0 && propertiesArray.length > 0) {
            console.log(`🔍 معالجة ${productData.variants.length} متغير...`);

            productData.variants.forEach((variant, index) => {
                const newVariantProperties = {};
                let isValidVariant = true;

                if (variant.properties && variant.properties.length > 0) {
                    variant.properties.forEach(extractedProp => {
                        const matchingProperty = propertiesArray.find(availableProp =>
                            availableProp.name.toLowerCase().trim() === extractedProp.name.toLowerCase().trim()
                        );

                        if (matchingProperty) {
                            const matchingValue = matchingProperty.values.find(availableValue =>
                                availableValue.toLowerCase().trim() === extractedProp.value.toLowerCase().trim()
                            );

                            if (matchingValue) {
                                newVariantProperties[matchingProperty.name] = [matchingValue];
                            } else {
                                isValidVariant = false;
                                console.log(`⚠️ متغير ${index + 1}: القيمة "${extractedProp.value}" غير موجودة في "${matchingProperty.name}"`);
                            }
                        } else {
                            isValidVariant = false;
                            console.log(`⚠️ متغير ${index + 1}: الخاصية "${extractedProp.name}" غير موجودة`);
                        }
                    });

                    if (isValidVariant && Object.keys(newVariantProperties).length > 0) {
                        validVariants.push({
                            properties: newVariantProperties,
                            price: Number(variant.price) || 100,
                            cost: Number(variant.cost) || 60,
                            stock: Number(variant.stock) || 10
                        });
                        console.log(`✅ متغير ${index + 1}: صالح`);
                    }
                }
            });

            if (validVariants.length > 0) {
                setVariants(validVariants);
                console.log(`✅ تم إضافة ${validVariants.length} متغير`);
            } else {
                console.log('⚠️ لم يتم إنشاء أي متغير صالح');
            }
        }

        // تطبيق العلامات المرجعية
        if (productData.tags && Array.isArray(productData.tags) && availableTags.length > 0) {
            const matchedTags = [];

            productData.tags.forEach(extractedTag => {
                const matchingTag = availableTags.find(availableTag =>
                    availableTag.toLowerCase().trim() === extractedTag.toLowerCase().trim()
                );

                if (matchingTag) {
                    matchedTags.push(matchingTag);
                    console.log(`✅ علامة: ${matchingTag}`);
                } else {
                    console.log(`⚠️ العلامة "${extractedTag}" غير موجودة في القائمة المتاحة`);
                }
            });

            if (matchedTags.length > 0) {
                setSelectedTags(matchedTags);
                console.log(`✅ تم إضافة ${matchedTags.length} علامة`);
            }
        }

        // عرض معلومات الألوان المكتشفة
        const colorsDetected = productData.colorsDetected || [];
        const colorMessage = colorsDetected.length > 0 
            ? `🎨 تم اكتشاف ${colorsDetected.length} لون: ${colorsDetected.join(', ')}\n` 
            : '';

        alert(
            '✅ تم استخراج معلومات المنتج بنجاح!\n\n' +
            colorMessage +
            `📦 تم إضافة ${validVariants.length} متغير\n\n` +
            'يمكنك الآن مراجعة البيانات وتعديلها حسب الحاجة.'
        );

    } catch (err) {
        console.error('❌ خطأ في تحليل الصور:', err);

        let errorMessage = 'حدث خطأ أثناء تحليل الصور';
        let errorDetails = '';

        if (err.response?.data) {
            const errorData = err.response.data;
            
            // استخدام رسالة الخطأ من السيرفر
            if (errorData.error) {
                errorMessage = errorData.error;
            }
            
            // إضافة التلميحات إن وجدت
            if (errorData.hint) {
                errorDetails = '💡 ' + errorData.hint;
            }
            
            // تفاصيل إضافية
            if (errorData.message) {
                errorDetails += (errorDetails ? '\n\n' : '') + '🔍 ' + errorData.message;
            }
            
            // حالات خاصة
            if (err.response.status === 400) {
                errorMessage = '⚠️ ' + errorMessage;
            } else if (err.response.status === 429) {
                errorMessage = '⏰ ' + errorMessage;
            } else if (err.response.status === 500) {
                errorMessage = '🔧 ' + errorMessage;
            }
            
        } else if (err.message) {
            if (err.message.includes('Network Error')) {
                errorMessage = 'فشل الاتصال بالخادم';
                errorDetails = '💡 تحقق من اتصال الإنترنت أو حاول لاحقاً';
            } else if (err.message.includes('timeout')) {
                errorMessage = 'انتهت مهلة الطلب';
                errorDetails = '💡 الصور قد تكون كبيرة جداً، حاول تقليل عددها';
            } else {
                errorDetails = err.message;
            }
        }

        const fullError = errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage;

        setAiError(fullError);
        setTimeout(() => setAiError(''), 10000); // 10 seconds

        alert('❌ فشل استخراج المعلومات\n\n' + fullError);
    } finally {
        setIsAnalyzing(false);
    }
}

    function VariantManager() {
        const [variantPrice, setVariantPrice] = useState('');
        const [variantCost, setVariantCost] = useState('');
        const [variantProperties, setVariantProperties] = useState({});
        const [stock, setStock] = useState('');

        useEffect(() => {
            if (editingIndex !== null) {
                const variant = variants[editingIndex];
                setVariantPrice(variant.price);
                setVariantCost(variant.cost);
                setStock(variant.stock);
                setVariantProperties(variant.properties);
            } else {
                setVariantProperties({});
            }
        }, [editingIndex]);

        const toggleVariantProperty = (propName, value) => {
            setVariantProperties(prev => ({
                ...prev,
                [propName]: [value]
            }));
        };

        const arePropertiesSelected = Object.keys(variantProperties).length > 0 &&
            Object.values(variantProperties).every(values => values.length > 0);

        const isDuplicateVariant = (newProperties, currentIndex = null) => {
            return variants.some((variant, index) => {
                if (currentIndex !== null && index === currentIndex) return false;
                return Object.keys(newProperties).every(key => {
                    const newValue = newProperties[key][0];
                    const existingValue = variant.properties[key][0];
                    return newValue === existingValue;
                });
            });
        };

        const addOrUpdateVariant = () => {
            if (arePropertiesSelected && variantPrice && variantCost && stock) {
                if (editingIndex !== null) {
                    if (isDuplicateVariant(variantProperties, editingIndex)) {
                        alert("لا يمكن تحديث المتغير لأنه يحتوي على قيم مشتركة مع متغير موجود مسبقاً");
                        return;
                    }
                    setVariants(prev => {
                        const newVariants = [...prev];
                        newVariants[editingIndex] = {
                            properties: { ...variantProperties },
                            price: Number(variantPrice),
                            cost: Number(variantCost),
                            stock: Number(stock)
                        };
                        return newVariants;
                    });
                    setEditingIndex(null);
                } else {
                    if (isDuplicateVariant(variantProperties)) {
                        alert("لا يمكن إضافة هذا المتغير لأنه يحتوي على قيم مشتركة مع متغير موجود مسبقاً");
                        return;
                    }
                    setVariants(prev => [...prev, {
                        properties: { ...variantProperties },
                        price: Number(variantPrice),
                        cost: Number(variantCost),
                        stock: Number(stock)
                    }]);
                }

                setVariantPrice('');
                setVariantCost('');
                setStock('');
                setVariantProperties({});
            }
        };

        const PropertiesSelector = () => (
            <div className="mb-4">
                {propertiesArray.length > 0 && propertiesArray.map(property => {
                    const { name, values } = property;
                    return (
                        <div className="gap-1 items-center mb-2" key={name}>
                            <label className="mb-1 cap">{name}</label>
                            <div className="flex flex-wrap gap-2">
                                {values.map(value => (
                                    <button
                                        type="button"
                                        key={value}
                                        className={`py-1 px-2 rounded-lg text-gray-100 ${variantProperties[name]?.[0] === value ? 'bg-h-glass' : 'bg-glass'
                                            }`}
                                        onClick={() => toggleVariantProperty(name, value)}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );

        return (
            <div className="mb-4">
                <h3>{editingIndex !== null ? 'تعديل المتغير' : 'إضافة متغير جديد'}</h3>

                <PropertiesSelector />

                <div className="grid gap-2">
                    {arePropertiesSelected && (
                        <>
                            <input
                                type="number"
                                placeholder="التكلفة"
                                value={variantCost}
                                onChange={e => setVariantCost(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="السعر"
                                value={variantPrice}
                                onChange={e => setVariantPrice(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="المخزون"
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={addOrUpdateVariant}
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    {editingIndex !== null ? 'تحديث المتغير' : 'إضافة متغير'}
                                </button>
                                {editingIndex !== null && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingIndex(null);
                                            setVariantProperties({});
                                            setVariantPrice('');
                                            setVariantCost('');
                                            setStock('');
                                        }}
                                        className="bg-gray-500 text-white px-4 py-2 rounded"
                                    >
                                        إلغاء التعديل
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // استبدل دالة VariantsList في ProductForm.js بهذا التصميم الأوضح:

    function VariantsList() {
        if (variants.length === 0) return null;

        // دالة لاختيار أفضل خاصية للتجميع
        const getBestGroupingProperty = (variants) => {
            if (variants.length === 0) return null;

            const propertyKeys = Object.keys(variants[0].properties);
            if (propertyKeys.length === 0) return null;

            const priorityOrder = ['التخزين', 'اللون', 'المقاس', 'الحجم'];

            for (const priority of priorityOrder) {
                const found = propertyKeys.find(key =>
                    key.toLowerCase().includes(priority.toLowerCase())
                );
                if (found) return found;
            }

            return propertyKeys.length > 1 ? propertyKeys[1] : propertyKeys[0];
        };

        const groupingProperty = getBestGroupingProperty(variants);

        // تجميع المتغيرات
        const groupedVariants = variants.reduce((groups, variant) => {
            const { price, cost } = variant;
            const groupByValue = variant.properties[groupingProperty]?.[0] || '';

            const groupKey = `${cost}-${price}-${groupByValue}`;

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    cost,
                    price,
                    groupByProperty: groupingProperty,
                    groupByValue: groupByValue,
                    variants: []
                };
            }

            groups[groupKey].variants.push(variant);
            return groups;
        }, {});

        return (
            <div className="mb-6 w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-glass/50">
                    <h3 className="text-2xl font-bold text-white">المتغيرات الحالية</h3>
                    <span className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 rounded-full text-sm font-bold">
                        {variants.length} متغير
                    </span>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Object.values(groupedVariants).map((group, groupIndex) => {
                        const totalStock = group.variants.reduce((sum, v) => sum + (v.stock || 0), 0);

                        return (
                            <div
                                key={groupIndex}
                                className="bg-gradient-to-br from-glass/40 to-glass/20 backdrop-blur-sm p-5 rounded-xl border-2 border-glass/40 hover:border-h-glass/60 transition-all duration-300 shadow-lg"
                            >
                                {/* رأس المجموعة */}
                                <div className="mb-4">
                                    {/* العنوان الرئيسي */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-h-glass px-3 py-1 rounded-lg">
                                            <span className="text-xs text-gray-300 block">
                                                {group.groupByProperty}
                                            </span>
                                            <span className="text-lg font-bold text-white block">
                                                {group.groupByValue}
                                            </span>
                                        </div>
                                    </div>

                                    {/* معلومات السعر والمخزون */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-black/60 p-2 rounded-lg text-center">
                                            <div className="text-xs text-gray-400 mb-1">التكلفة</div>
                                            <div className="text-base font-bold text-white">{group.cost}</div>
                                            <div className="text-xs text-gray-400">ريال</div>
                                        </div>
                                        <div className="bg-green-600/30 p-2 rounded-lg text-center border border-green-500/50">
                                            <div className="text-xs text-gray-300 mb-1">السعر</div>
                                            <div className="text-base font-bold text-green-300">{group.price}</div>
                                            <div className="text-xs text-gray-300">ريال</div>
                                        </div>
                                        <div className="bg-blue-600/30 p-2 rounded-lg text-center border border-blue-500/50">
                                            <div className="text-xs text-gray-300 mb-1">المخزون</div>
                                            <div className="text-base font-bold text-blue-300">{totalStock}</div>
                                            <div className="text-xs text-gray-300">قطعة</div>
                                        </div>
                                    </div>
                                </div>

                                {/* المتغيرات */}
                                <div className="space-y-2">
                                    {group.variants.map((variant, variantIndex) => {
                                        const otherProperties = Object.entries(variant.properties)
                                            .filter(([key]) => key !== group.groupByProperty);

                                        return (
                                            <div
                                                key={variantIndex}
                                                className="bg-black/40 p-3 rounded-lg border border-glass/50 hover:bg-glass/60 hover:border-h-glass/60 transition-all duration-200"
                                            >
                                                {/* الخصائص والمخزون */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex gap-2 flex-wrap flex-1">
                                                        {otherProperties.length > 0 ? (
                                                            otherProperties.map(([key, values]) => (
                                                                <div
                                                                    key={key}
                                                                    className="bg-black/80 px-3 py-1 rounded-md"
                                                                >
                                                                    <span className="text-xs text-gray-300">{key}: </span>
                                                                    <span className="text-sm font-bold text-white">
                                                                        {values.join(', ')}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">
                                                                بدون خصائص إضافية
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* المخزون الفردي */}
                                                    <div className="bg-blue-600/40 px-3 py-1 rounded-md border border-blue-500/50 whitespace-nowrap">
                                                        <span className="text-sm font-bold text-blue-200">
                                                            {variant.stock} قطعة
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* أزرار التحكم */}
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingIndex(variants.indexOf(variant))}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                                    >
                                                        ✏️ تعديل
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm('هل أنت متأكد من حذف هذا المتغير؟')) {
                                                                setVariants(prev => prev.filter(v => v !== variant));
                                                            }
                                                        }}
                                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg"
                                                    >
                                                        🗑️ حذف
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    async function saveProducts(ev) {
        ev.preventDefault();
        const data = {
            title,
            description,
            images,
            category,
            properties: productProperties,
            tags: selectedTags,
            variants,
        };
        try {
            if (_id) {
                await axios.put('/api/products', { ...data, _id });
                router.back();
            } else {
                const response = await axios.post('/api/products', data);
                router.push('/products');
            }
        } catch (error) {
            console.error('Error saving product:', error.response?.data || error.message);
        }
    }

    async function uploadImages(ev) {
        const files = ev.target?.files;

        if (files?.length > 0) {
            setIsUploading(true);
            const data = new FormData();
            for (const file of files) {
                data.append('file', file);
            }
            const res = await axios.post('/api/upload', data);
            setImages(oldImages => {
                return [...oldImages, ...res.data.Links];
            });
            setIsUploading(false);
        }
    }

    function imagesOrdering(images) {
        setImages(images);
    }

    async function removeImage(imageLink) {
        setImages(images.filter(img => img !== imageLink));
    }

    const propertiesToFill = new Set();
    const visitedCategories = new Set();

    if (Array.isArray(categories) && categories.length > 0 && category) {
        let catInfo = categories.find(({ _id }) => _id === category);
        while (catInfo && !visitedCategories.has(catInfo._id)) {
            visitedCategories.add(catInfo._id);

            if (Array.isArray(catInfo.properties)) {
                catInfo.properties.forEach(prop => propertiesToFill.add(prop));
            }
            catInfo = categories.find(({ _id }) => _id === catInfo?.parent?._id);
        }
    }
    const propertiesArray = Array.from(propertiesToFill);

    function toggleTag(tag) {
        setSelectedTags(prev => {
            const isTagSelected = prev.includes(tag);
            if (isTagSelected) {
                return prev.filter(t => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
    }

    function toggleAllTags() {
        if (selectedTags.length === availableTags.length) {
            setSelectedTags([]);
        } else {
            setSelectedTags([...availableTags]);
        }
    }

    function updateTags(categories, selectedCategory) {
        const tags = new Set();
        if (Array.isArray(categories)) {
            const category = categories.find(cat => cat._id === selectedCategory);
            if (category && Array.isArray(category.tags)) {
                category.tags.forEach(tag => tags.add(tag));
            }
        }
        setAvailableTags(Array.from(tags));
    }

    function handleCategoryChange(ev) {
        const selectedCategory = ev.target.value;
        setCategory(selectedCategory);
        updateTags(categories, selectedCategory);
        setSelectedTags([]);
    }

    return (
        <form onSubmit={saveProducts}>
            <div className="flex flex-col justify-start items-start h-full p-4">
                <label>صور المنتج</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    <ReactSortable list={images} className="flex flex-wrap gap-2" setList={imagesOrdering}>
                        {!!images?.length && images.map(Link => (
                            <div key={Link} className="relative w-44 h-56 p-2 rounded-md">
                                <img src={Link} alt="product image" className="w-full h-full object-cover border rounded-lg cursor-move" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(Link)}
                                    className="absolute top-2 right-2 bg-red-700 text-white p-0.5 rounded-lg m-1">
                                    <Trash2 className="w-5" />
                                </button>
                            </div>
                        ))}
                    </ReactSortable>

                    {isUploading && (
                        <div className="flex items-center justify-center w-32 h-24 bg-glass rounded-lg">
                            <Loader />
                        </div>
                    )}

                    {/* مربع رفع الصور */}
                    <label className="w-32 h-24 cursor-pointer bg-gray-400 text-gray-800 rounded-lg text-center flex flex-col items-center justify-center text-xl">
                        <Upload className="w-32 h-12 text-gray-800" />
                        <div>اضف الصور</div>
                        <input
                            type="file"
                            className="hidden"
                            onChange={uploadImages}
                            multiple={true}
                        />
                    </label>

                </div>

                {/* زر استخراج المعلومات بالذكاء الاصطناعي */}
                {images.length > 0 && (
                    <div className="w-full mb-6">
                        <button
                            type="button"
                            onClick={analyzeImagesWithAI}
                            disabled={isAnalyzing}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>جاري استخراج المعلومات من الصورة...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>استخراج معلومات المنتج بالذكاء الاصطناعي</span>
                                </>
                            )}
                        </button>
                        {aiError && (
                            <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                                {aiError}
                            </div>
                        )}
                        {isAnalyzing && (
                            <p className="mt-2 text-sm text-gray-600 text-center">
                                ⏳ يتم تحليل الصورة... قد يستغرق هذا بضع ثوانٍ
                            </p>
                        )}
                    </div>
                )}

                <label>اسم المنتج</label>
                <input
                    type="text"
                    placeholder="اسم المنتج"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)} />

                <label>وصف المنتج</label>
                <textarea
                    placeholder="وصف المنتج"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    cols={50}
                />

                <label>فئة المنتج</label>
                <select value={category} onChange={handleCategoryChange}>
                    <option value="" className="bg-black cap">بدون فئة</option>
                    {categories.length > 0 && categories.map(category => (
                        <option key={category._id} value={category._id} className="bg-black">{category.name}</option>
                    ))}
                </select>

                <VariantManager />
                <VariantsList />

                <label>علامات المنتج المرجعية</label>
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        type="button"
                        className={`py-1 px-2 rounded-lg ${selectedTags.length === availableTags.length
                            ? 'bg-black'
                            : 'bg-white text-black '
                            } `}
                        onClick={toggleAllTags}
                    >
                        {selectedTags.length === availableTags.length
                            ? 'إلغاء اختيار كل العلامات'
                            : 'اختيار كل العلامات'}
                    </button>
                    {availableTags.map(tag => (
                        <button
                            key={tag}
                            type="button"
                            className={`py-1 px-2 rounded-lg ${selectedTags.includes(tag) ? 'bg-h-glass' : 'bg-glass'}`}
                            onClick={() => toggleTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                <button type="submit" className="bg-h-glass hover:bg-glass mt-6 text-white py-2 px-4 rounded-full">
                    حفظ المنتج
                </button>
            </div>
        </form>
    );
}