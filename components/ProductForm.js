import axios from "axios";
import { Trash2, Upload } from "lucide-react";
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

    function VariantsList() {
        // تجميع المتغيرات حسب التكلفة، السعر، والخاصية الثانية
        const groupedVariants = variants.reduce((groups, variant) => {
            const { price, cost } = variant;

            // اختيار الخاصية الثانية ديناميكيًا للتجميع
            const propertyKeys = Object.keys(variant.properties);
            const secondPropertyKey = propertyKeys[1] || propertyKeys[0]; // اختيار الخاصية الثانية أو الأولى في حال عدم وجود خاصية ثانية
            const secondPropertyValue = variant.properties[secondPropertyKey]?.[0] || ''; // الحصول على القيمة

            // إنشاء مفتاح للتجميع بناءً على التكلفة، السعر، والخاصية الثانية
            const groupKey = `${cost}-${price}-${secondPropertyValue}`;

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    cost,
                    price,
                    mainProperty: secondPropertyKey,
                    mainValue: secondPropertyValue,
                    variants: []
                };
            }
            groups[groupKey].variants.push(variant);
            return groups;
        }, {});

        return (
            <div className="mb-4">
                <h3>المتغيرات الحالية</h3>
                <div className="md:flex gap-2">
                    {Object.values(groupedVariants).map((group, groupIndex) => (
                        <div key={groupIndex} className="mb-6 bg-glass/30 p-4 rounded-lg">
                            <div className="mb-2">
                                <h4 className="text-lg">{group.mainProperty}: {group.mainValue}</h4>
                                <div className="flex gap-2 text-sm text-gray-300">
                                    <span>التكلفة: {group.cost} ريال</span>
                                    <span>السعر: {group.price} ريال</span>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-col">
                                {group.variants.map((variant, index) => (
                                    <div key={index} className="flex gap-2 border-b border-glass/50 pb-2">
                                        {/* عرض الخصائص الأخرى عدا الخاصية الرئيسية المستخدمة في التجميع */}
                                        {Object.entries(variant.properties)
                                            .filter(([key]) => key !== group.mainProperty)
                                            .map(([key, values]) => (
                                                <span key={key} className="bg-glass p-1 rounded">
                                                    {key}: {values.join(', ')}
                                                </span>
                                            ))}
                                        <div className="flex gap-0.5 items-center">
                                            <span className="bg-glass p-1 rounded">المخزون: {variant.stock}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditingIndex(variants.indexOf(variant))}
                                                className="bg-blue-500 text-white px-2 py-1 rounded"
                                            >
                                                تعديل
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm('هل أنت متأكد من حذف هذا المتغير؟')) {
                                                        setVariants(prev => prev.filter(v => v !== variant));
                                                    }
                                                }}
                                                className="bg-red-500 text-white px-2 py-1 rounded"
                                            >
                                                حذف
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
                // نستخدم router.back() للعودة للصفحة السابقة مباشرة
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

                <label>صور المنتج</label>
                <div className="mt-2 flex flex-wrap gap-2">
                    <ReactSortable list={images} className="flex flex-wrap" setList={imagesOrdering}>
                        {!!images?.length && images.map(Link => (
                            <div key={Link} className="relative w-44 h-56 p-2 rounded-md">
                                <img src={Link} alt="product image" className="w-full h-full object-cover border rounded-lg cursor-move" />
                                <button
                                    onClick={() => removeImage(Link)}
                                    className="absolute top-2 right-2 bg-red-700 text-white p-0.5 rounded-lg m-1">
                                    <Trash2 className="w-5" />
                                </button>
                            </div>
                        ))}
                    </ReactSortable>
                    {isUploading && (
                        <div className="flex items-center justify-between p-2 rounded-md">
                            <Loader />
                        </div>
                    )}
                    <label className="w-32 mb-4 h-24 mt-8 cursor-pointer bg-gray-400 text-gray-800 rounded-lg text-center flex flex-col items-center justify-center text-xl">
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
                <button type="submit" className="bg-h-glass hover:bg-glass mt-6 text-white py-2 px-4 rounded-full">
                    حفظ المنتج
                </button>
            </div>
        </form>
    );
}
