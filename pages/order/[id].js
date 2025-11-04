import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';
import { Box } from "lucide-react";

export default function Order() {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        const fetchOrder = async () => {
            if (id) {
                try {
                    const response = await axios.get(`/api/orders/${id}`);
                    setOrder(response.data);
                } catch (error) {
                    setError(error.message || "An error occurred while fetching the order.");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
                    <p className="font-bold">خطأ</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
                    <p className="font-bold">لم يتم العثور على بيانات الطلب</p>
                    <p>ID: {id}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-2 py-2">
            <h1 className="text-2xl font-medium mb-6 text-gray-200">تفاصيل الطلب</h1>
            <div className="bg-glass rounded-lg shadow-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-300 text-xl">
                        {new Date(order.createdAt).toLocaleString('ar-SA')}
                    </span>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-200">معلومات المستلم</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center"><FaUser className="ml-2 text-blue-400" /> {order.firstName} {order.lastName}</li>
                            <li className="flex items-center"><FaEnvelope className="ml-2 text-blue-400" /> {order.email}</li>
                            <li className="flex items-center"><FaPhone className="ml-2 text-blue-400" /> {order.phone}</li>
                            <li className="flex items-center"><FaMapMarkerAlt className="ml-2 text-blue-400" /> {order.address} {order.address2}, {order.city}, {order.state} {order.postalCode}</li>
                            <li className="flex items-center"><FaGlobe className="ml-2 text-blue-400" /> {order.country}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-200">ملخص الطلب</h3>
                        <ul className="space-y-2">
                            {order.items && order.items.map((item, index) => (
                                <li key={item._id.$oid}>
                                    <div className="flex items-start">
                                        <img src={item.image} alt={item.title} className="w-16 h-full object-cover rounded-md ml-2" />
                                        <div>
                                            <p className="font-semibold text-gray-200">{item.title}</p>
                                            <p className="text-gray-300">
                                                {Object.entries(item.properties).map(([key, value]) => (
                                                    `${key}: ${value}`
                                                )).join(' | ')}
                                            </p>
                                            <p className="text-gray-300">الكمية: {item.quantity}</p>
                                            <p className="text-gray-300">السعر: {item.price} ريال</p>
                                        </div>
                                    </div>
                                    {/* Add separator line if not the last item */}
                                    {index < order.items.length - 1 && (
                                        <hr className="my-2 border-gray-200" />
                                    )}
                                </li>
                            ))}

                        </ul>
                        <div className="mt-4 border-t pt-4">
                            <p className="text-gray-200">تكلفة الشحن: {order.shippingCost} ريال</p>
                            <p className="text-xl font-bold text-gray-200">المجموع الكلي: {order.totalAmount} ريال</p>
                        </div>
                    </div>
                </div>
                {order.notes && (
                    <div className="mt-6 border rounded-md border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">ملاحظات الطلب:</h3>
                        <p className="text-gray-400 text-lg">{order.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
