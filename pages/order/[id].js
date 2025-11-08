import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

export default function Order() {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        const fetchOrder = async () => {
            if (id) {
                try {
                    console.log('Fetching order with ID:', id);
                    const response = await axios.get(`/api/orders/${id}`);
                    console.log('Order fetched successfully:', response.data);
                    console.log('Order paid status:', response.data.paid);
                    console.log('Order status:', response.data.status);
                    setOrder(response.data);
                } catch (error) {
                    console.error('Error fetching order:', error);
                    setError(error.message || "An error occurred while fetching the order.");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchOrder();
    }, [id]);

    const handleCancelOrder = async () => {
        if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟ سيتم إرجاع المنتجات إلى المخزون.')) {
            return;
        }

        setCancelling(true);
        try {
            console.log('Cancelling order:', id);
            const response = await axios.post('/api/orders/cancel', { orderId: id });
            console.log('Cancel response:', response.data);
            setOrder({ ...order, status: 'cancelled' });
            alert('تم إلغاء الطلب بنجاح وإعادة المنتجات إلى المخزون');
        } catch (error) {
            console.error("Error cancelling order:", error);
            console.error("Error details:", error.response?.data);
            alert('حدث خطأ أثناء إلغاء الطلب: ' + (error.response?.data?.error || error.message));
        } finally {
            setCancelling(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        console.log('=== Starting status update ===');
        console.log('Order ID:', id);
        console.log('Current status:', order?.status);
        console.log('New status:', newStatus);
        
        setStatusUpdating(true);
        try {
            console.log('Sending request to /api/orders/updateStatus');
            const response = await axios.post('/api/orders/updateStatus', { 
                orderId: id, 
                status: newStatus 
            });
            
            console.log('Response received:', response.data);
            
            if (response.data.success) {
                // تحديث الحالة المحلية
                setOrder({ ...order, status: newStatus });
                console.log('Local state updated successfully');
                alert('تم تحديث حالة الطلب بنجاح');
                
                // إعادة جلب الطلب للتأكد من التحديث
                const refreshResponse = await axios.get(`/api/orders/${id}`);
                console.log('Refreshed order data:', refreshResponse.data);
                setOrder(refreshResponse.data);
            }
        } catch (error) {
            console.error("=== Error updating order status ===");
            console.error("Error object:", error);
            console.error("Error response:", error.response);
            console.error("Error data:", error.response?.data);
            
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.details || 
                               error.message || 
                               'حدث خطأ أثناء تحديث حالة الطلب';
            alert(errorMessage);
        } finally {
            setStatusUpdating(false);
            console.log('=== Status update complete ===');
        }
    };

    const getOrderStatus = (status) => {
        const statusMap = {
            'pending': 'قيد التجهيز',
            'processing': 'قيد المعالجة',
            'shipped': 'تم الشحن',
            'delivered': 'تم الاستلام',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'pending': 'text-yellow-400 bg-yellow-900/30',
            'processing': 'text-blue-400 bg-blue-900/30',
            'shipped': 'text-purple-400 bg-purple-900/30',
            'delivered': 'text-green-400 bg-green-900/30',
            'cancelled': 'text-red-400 bg-red-900/30'
        };
        return colorMap[status] || 'text-gray-400 bg-gray-900/30';
    };

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

    // التحقق من حالة الدفع بشكل صحيح
    const isPaid = order.paid === true || order.paid === 'true';
    console.log('Rendering order, paid status:', isPaid, 'raw value:', order.paid);

    return (
        <div className="container mx-auto px-2 py-2">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-medium text-gray-200">تفاصيل الطلب</h1>
                <button
                    onClick={() => router.back()}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    رجوع
                </button>
            </div>

            <div className="bg-glass rounded-lg shadow-lg p-6 mb-6">
                {/* Order Header */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div>
                        <p className="text-gray-400 text-sm">رقم الطلب</p>
                        <p className="text-blue-300 text-xl font-semibold">{order._id.slice(-8)}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">التاريخ</p>
                        <p className="text-gray-200 text-lg">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">حالة الدفع</p>
                        {isPaid ? (
                            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold text-green-400 bg-green-900/30">
                                مدفوع ✓
                            </span>
                        ) : (
                            <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold text-red-400 bg-red-900/30">
                                غير مدفوع
                            </span>
                        )}
                    </div>
                </div>

                {/* Order Status Section */}
                <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-gray-400 text-sm mb-2">حالة الطلب</p>
                            <span className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${getStatusColor(order.status)}`}>
                                {getOrderStatus(order.status)}
                            </span>
                        </div>
                        
                        {/* Status Update Dropdown */}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <div className="flex items-center gap-3">
                                <select
                                    value={order.status}
                                    onChange={(e) => {
                                        console.log('Select changed, new value:', e.target.value);
                                        handleStatusChange(e.target.value);
                                    }}
                                    disabled={statusUpdating}
                                    className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    <option value="pending">قيد التجهيز</option>
                                    <option value="processing">قيد المعالجة</option>
                                    <option value="shipped">تم الشحن</option>
                                    <option value="delivered">تم الاستلام</option>
                                </select>
                                
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={cancelling}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancelling ? 'جاري الإلغاء...' : 'إلغاء الطلب'}
                                </button>
                            </div>
                        )}

                        {order.status === 'cancelled' && (
                            <div className="text-red-400 font-semibold">
                                تم إلغاء هذا الطلب
                            </div>
                        )}

                        {order.status === 'delivered' && (
                            <div className="text-green-400 font-semibold">
                                تم استلام هذا الطلب
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Information */}
                    <div className="bg-gray-800/30 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">
                            معلومات المستلم
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-center text-gray-300">
                                <FaUser className="ml-3 text-blue-400 flex-shrink-0" />
                                <span>{order.firstName} {order.lastName}</span>
                            </li>
                            <li className="flex items-center text-gray-300">
                                <FaEnvelope className="ml-3 text-blue-400 flex-shrink-0" />
                                <span className="break-all">{order.email}</span>
                            </li>
                            <li className="flex items-center text-gray-300">
                                <FaPhone className="ml-3 text-blue-400 flex-shrink-0" />
                                <span dir="ltr">{order.phone}</span>
                            </li>
                            <li className="flex items-start text-gray-300">
                                <FaMapMarkerAlt className="ml-3 mt-1 text-blue-400 flex-shrink-0" />
                                <span>
                                    {order.address} {order.address2 && `, ${order.address2}`}
                                    <br />
                                    {order.city}, {order.state} {order.postalCode}
                                </span>
                            </li>
                            <li className="flex items-center text-gray-300">
                                <FaGlobe className="ml-3 text-blue-400 flex-shrink-0" />
                                <span>{order.country}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-800/30 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">
                            ملخص الطلب
                        </h3>
                        <ul className="space-y-4">
                            {order.items && order.items.map((item, index) => (
                                <li key={item._id?.$oid || item._id || index}>
                                    <div className="flex items-start gap-3">
                                        <img 
                                            src={item.image} 
                                            alt={item.title} 
                                            className="w-20 h-20 object-cover rounded-md flex-shrink-0" 
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-200 mb-1">{item.title}</p>
                                            <p className="text-gray-400 text-sm">
                                                {Object.entries(item.properties || {}).map(([key, value]) => (
                                                    `${key}: ${value}`
                                                )).join(' | ')}
                                            </p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-gray-300">الكمية: {item.quantity}</span>
                                                <span className="text-green-400 font-semibold">{item.price} ريال</span>
                                            </div>
                                        </div>
                                    </div>
                                    {index < order.items.length - 1 && (
                                        <hr className="my-3 border-gray-700" />
                                    )}
                                </li>
                            ))}
                        </ul>
                        
                        {/* Price Summary */}
                        <div className="mt-6 border-t border-gray-700 pt-4 space-y-2">
                            <div className="flex justify-between text-gray-300">
                                <span>المجموع الفرعي:</span>
                                <span>{(order.totalAmount - order.shippingCost).toFixed(2)} ريال</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>تكلفة الشحن:</span>
                                <span>{order.shippingCost} ريال</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-200 border-t border-gray-700 pt-2">
                                <span>المجموع الكلي:</span>
                                <span className="text-green-400">{order.totalAmount} ريال</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Notes */}
                {order.notes && (
                    <div className="mt-6 border rounded-lg border-gray-700 bg-gray-800/30 p-4">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">ملاحظات الطلب:</h3>
                        <p className="text-gray-400 text-lg">{order.notes}</p>
                    </div>
                )}

                {/* Payment ID */}
                {order.paymentId && (
                    <div className="mt-4 text-gray-400 text-sm">
                        معرف الدفع: {order.paymentId}
                    </div>
                )}
            </div>
        </div>
    );
}