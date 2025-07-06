import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import Loader from "@/components/Loader";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get('/api/orders');
                // Sort orders by date, newest first
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

        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleOrderClick = async (orderId) => {
        try {
            await axios.post('/api/updateOrderView', { orderId });
            setOrders(orders.map(order =>
                order._id === orderId ? { ...order, viewed: true } : order
            ));
            router.push(`/order/${orderId}`);
        } catch (error) {
            console.error("Error updating order view status:", error);
        }
    };

    const getOrderStatus = (status) => {
        const statusMap = {
            'pending': 'قيد الانتظار',
            'processing': 'قيد المعالجة',
            'shipped': 'تم الشحن',
            'delivered': 'تم التوصيل',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'pending': 'text-yellow-500',
            'processing': 'text-blue-500',
            'shipped': 'text-purple-500',
            'delivered': 'text-green-500',
            'cancelled': 'text-red-500'
        };
        return colorMap[status] || 'text-gray-500';
    };

    const filteredOrders = orders.filter(order =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${order.firstName} ${order.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm) ||
        order.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4">
            <h1 className="text-3xl font-bold mb-6 text-gray-200">الطلبات</h1>
            <input
                type="text"
                placeholder="البحث (رقم الطلب، اسم العميل، رقم الهاتف، البريد)"
                className="mb-4 p-2 w-full rounded-lg border text-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                                المنتجات
                            </th>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                المبلغ الإجمالي
                            </th>
                            <th className="px-5 py-3 bg-glass text-center text-lg font-semibold text-gray-300">
                                تاريخ الطلب
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrders.map(order => (
                            <tr key={order._id} className="hover:bg-glass cursor-pointer">
                                <td
                                    className="px-5 py-5 text-lg text-center"
                                    onClick={() => handleOrderClick(order._id)}
                                >
                                    <span className="text-blue-300 hover:text-blue-500 transition-colors">
                                        {order._id.slice(-6)}
                                    </span>
                                    {!order.viewed && (
                                        <span className="mr-2 text-red-500 font-bold">جديد</span>
                                    )}
                                </td>
                                <td className="px-5 py-5 text-lg text-center">
                                    <div className="font-semibold">{order.firstName} {order.lastName}</div>
                                </td>

                                <td className="px-5 py-5 text-lg text-center">
                                    <div className="text-xl text-gray-400">
                                        {order.items?.reduce((total, item) => total + item.quantity, 0)}
                                    </div>
                                </td>

                                <td className="px-5 py-5 text-green-500 text-lg text-center font-bold">
                                    {(order.totalAmount || 0).toFixed(2)} ريال
                                </td>
                                <td className="px-5 py-5 text-lg text-center">
                                    {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </td>
                            </tr>

                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between mt-4">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-h-glass text-white px-4 py-2 rounded disabled:bg-glass"
                >
                    الصفحة السابقة
                </button>
                <span className="text-gray-200">
                    الصفحة {currentPage} من {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-h-glass text-white px-4 py-2 rounded disabled:bg-glass"
                >
                    الصفحة التالية
                </button>
            </div>
        </div>
    );
}
