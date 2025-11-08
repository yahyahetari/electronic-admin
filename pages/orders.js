import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import Loader from "@/components/Loader";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [viewFilter, setViewFilter] = useState("all");
    const [dateSort, setDateSort] = useState("newest");
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const ordersPerPage = 10;
    const router = useRouter();

    const fetchOrders = async () => {
        try {
            const response = await axios.get('/api/orders');
            console.log('Fetched orders:', response.data.length);
            
            // طباعة تفاصيل أول طلب للتشخيص
            if (response.data.length > 0) {
                const firstOrder = response.data[0];
                console.log('Sample order:', {
                    id: firstOrder._id?.slice(-6),
                    paid: firstOrder.paid,
                    paidType: typeof firstOrder.paid,
                    status: firstOrder.status,
                    statusType: typeof firstOrder.status
                });
            }
            
            const sortedOrders = response.data.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setOrders(sortedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // تحديث الطلبات كل 5 ثوان
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    // إضافة دالة للتحديث اليدوي
    const handleRefresh = () => {
        setLoading(true);
        fetchOrders();
    };

    const handleOrderClick = async (orderId) => {
        try {
            await axios.post('/api/updateOrderView', { orderId });
            // تحديث الحالة المحلية
            setOrders(orders.map(order =>
                order._id === orderId ? { ...order, viewed: true } : order
            ));
            router.push(`/order/${orderId}`);
        } catch (error) {
            console.error("Error updating order view status:", error);
            // الانتقال حتى لو فشل التحديث
            router.push(`/order/${orderId}`);
        }
    };

    const handleCancelOrder = async (orderId, e) => {
        e.stopPropagation();
        
        if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟ سيتم إرجاع المنتجات إلى المخزون.')) {
            return;
        }

        setCancellingOrderId(orderId);
        try {
            await axios.post('/api/orders/cancel', { orderId });
            // إعادة جلب الطلبات للحصول على البيانات المحدثة
            await fetchOrders();
            alert('تم إلغاء الطلب بنجاح وإعادة المنتجات إلى المخزون');
        } catch (error) {
            console.error("Error cancelling order:", error);
            alert('حدث خطأ أثناء إلغاء الطلب');
        } finally {
            setCancellingOrderId(null);
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
            'pending': 'text-yellow-400',
            'processing': 'text-blue-400',
            'shipped': 'text-purple-400',
            'delivered': 'text-green-400',
            'cancelled': 'text-red-400'
        };
        return colorMap[status] || 'text-gray-400';
    };

    const getStatusBgColor = (status) => {
        const colorMap = {
            'pending': 'bg-yellow-900/30',
            'processing': 'bg-blue-900/30',
            'shipped': 'bg-purple-900/30',
            'delivered': 'bg-green-900/30',
            'cancelled': 'bg-red-900/30'
        };
        return colorMap[status] || 'bg-gray-900/30';
    };

    let filteredOrders = orders.filter(order => {
        const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.phone.includes(searchTerm) ||
            order.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        
        // إصلاح فلتر الدفع - التحقق الصحيح من القيمة
        const isPaid = order.paid === true || order.paid === 'true';
        const matchesPayment = paymentFilter === "all" || 
            (paymentFilter === "paid" && isPaid) || 
            (paymentFilter === "unpaid" && !isPaid);
            
        const matchesView = viewFilter === "all" || 
            (viewFilter === "new" && !order.viewed) || 
            (viewFilter === "old" && order.viewed);

        return matchesSearch && matchesStatus && matchesPayment && matchesView;
    });

    // Sort by date
    filteredOrders = filteredOrders.sort((a, b) => {
        if (dateSort === "newest") {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
    });

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, paymentFilter, viewFilter, searchTerm, dateSort]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-200">الطلبات</h1>
                <button
                    onClick={handleRefresh}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    تحديث
                </button>
            </div>
            
            {/* Search Bar */}
            <input
                type="text"
                placeholder="البحث (رقم الطلب، اسم العميل، رقم الهاتف، البريد)"
                className="mb-4 p-3 w-full rounded-lg border bg-gray-800 text-gray-200 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-3 rounded-lg border bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">جميع الحالات</option>
                    <option value="pending">قيد التجهيز</option>
                    <option value="processing">قيد المعالجة</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="delivered">تم الاستلام</option>
                    <option value="cancelled">ملغي</option>
                </select>

                {/* Payment Filter */}
                <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="p-3 rounded-lg border bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">حالة الدفع</option>
                    <option value="paid">مدفوع</option>
                    <option value="unpaid">غير مدفوع</option>
                </select>

                {/* View Filter */}
                <select
                    value={viewFilter}
                    onChange={(e) => setViewFilter(e.target.value)}
                    className="p-3 rounded-lg border bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">جميع الطلبات</option>
                    <option value="new">جديد</option>
                    <option value="old">قديم</option>
                </select>

                {/* Date Sort */}
                <select
                    value={dateSort}
                    onChange={(e) => setDateSort(e.target.value)}
                    className="p-3 rounded-lg border bg-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="newest">الأحدث أولاً</option>
                    <option value="oldest">الأقدم أولاً</option>
                </select>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-gray-300">
                عرض {filteredOrders.length} طلب
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto bg-glass shadow-lg rounded-lg">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                رقم الطلب
                            </th>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                العميل
                            </th>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                حالة الطلب
                            </th>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                الدفع
                            </th>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                المبلغ الإجمالي
                            </th>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                تاريخ الطلب
                            </th>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                إجراءات
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrders.length > 0 ? (
                            currentOrders.map(order => {
                                // التحقق من حالة الدفع بشكل صحيح
                                const isPaid = order.paid === true || order.paid === 'true';
                                
                                return (
                                    <tr 
                                        key={order._id} 
                                        className="hover:bg-glass cursor-pointer border-b border-gray-700"
                                        onClick={() => handleOrderClick(order._id)}
                                    >
                                        <td className="px-5 py-5 text-lg text-center">
                                            <span className="text-blue-300 hover:text-blue-500 transition-colors">
                                                {order._id.slice(-6)}
                                            </span>
                                            {!order.viewed && (
                                                <span className="mr-2 text-red-500 font-bold text-sm">جديد</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-5 text-lg text-center">
                                            <div className="font-semibold text-gray-200">
                                                {order.firstName} {order.lastName}
                                            </div>
                                        </td>
                                        <td className="px-5 py-5 text-lg text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)} ${getStatusBgColor(order.status)}`}>
                                                {getOrderStatus(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 text-lg text-center">
                                            {isPaid ? (
                                                <span className="px-3 py-1 rounded-full text-sm font-semibold text-green-400 bg-green-900/30">
                                                    مدفوع ✓
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-sm font-semibold text-red-400 bg-red-900/30">
                                                    غير مدفوع
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-5 text-green-400 text-lg text-center font-bold">
                                            {(order.totalAmount || 0).toFixed(2)} ريال
                                        </td>
                                        <td className="px-5 py-5 text-lg text-center text-gray-300">
                                            {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-5 py-5 text-lg text-center">
                                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                <button
                                                    onClick={(e) => handleCancelOrder(order._id, e)}
                                                    disabled={cancellingOrderId === order._id}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {cancellingOrderId === order._id ? 'جاري الإلغاء...' : 'إلغاء'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-5 py-10 text-center text-gray-400 text-lg">
                                    لا توجد طلبات تطابق البحث والفلاتر
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="bg-h-glass hover:bg-glass text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        الصفحة السابقة
                    </button>
                    <span className="text-gray-200 text-lg">
                        الصفحة {currentPage} من {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="bg-h-glass hover:bg-glass text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        الصفحة التالية
                    </button>
                </div>
            )}
        </div>
    );
}