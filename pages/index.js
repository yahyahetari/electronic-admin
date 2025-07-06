import { useEffect, useState } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import { FaDollarSign, FaChartLine, FaUsers, FaMoneyBillWave, FaClipboardList, FaBoxOpen } from 'react-icons/fa';
import { useRouter } from 'next/router';

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        uniqueCustomers: 0,
        thisMonthRevenue: 0,
        lastMonthRevenue: 0,
        totalProfit: 0,
        thisMonthProfit: 0,
        lastMonthProfit: 0,
        newOrders: 0,
        monthlyRevenue: {},
        monthlyProfit: {}
    });
    const [loading, setLoading] = useState(true);
    const [showRevenueDetails, setShowRevenueDetails] = useState(false);
    const [showProfitDetails, setShowProfitDetails] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [dashboardResponse, ordersResponse] = await Promise.all([
                    axios.get('/api/dashboard-stats'),
                    axios.get('/api/orders')
                ]);

                const orders = ordersResponse.data;
                const newOrdersCount = orders.filter(order => !order.viewed).length;

                const dashboardData = {
                    ...dashboardResponse.data,
                    newOrders: newOrdersCount
                };

                localStorage.setItem('dashboardStats', JSON.stringify(dashboardData));
                localStorage.setItem('dashboardStatsTime', Date.now().toString());
                setStats(dashboardData);
            } catch (error) {
                console.error("خطأ في جلب الإحصائيات:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleCardClick = (route) => {
        router.push(route);
    };

    const handleTotalRevenueClick = () => {
        setShowRevenueDetails(!showRevenueDetails);
    };

    const handleTotalProfitClick = () => {
        setShowProfitDetails(!showProfitDetails);
    };

    const monthNames = {
        '01': 'يناير',
        '02': 'فبراير',
        '03': 'مارس',
        '04': 'أبريل',
        '05': 'مايو',
        '06': 'يونيو',
        '07': 'يوليو',
        '08': 'أغسطس',
        '09': 'سبتمبر',
        '10': 'أكتوبر',
        '11': 'نوفمبر',
        '12': 'ديسمبر'
    };

    const formatMonthKey = (key) => {
        const [year, month] = key.split('-');
        return `${monthNames[month]} ${year}`;
    };

    const RevenueDetailsCard = () => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-200">تفاصيل الإيرادات الشهرية</h2>
                        <button
                            onClick={() => setShowRevenueDetails(false)}
                            className="text-gray-400 hover:text-red-600"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(stats.monthlyRevenue)
                            .sort((a, b) => b[0].localeCompare(a[0]))
                            .map(([monthKey, revenue]) => (
                                <div key={monthKey} className="bg-gray-700 p-4 rounded-lg">
                                    <h3 className="text-gray-200 mb-2">{formatMonthKey(monthKey)}</h3>
                                    <p className="text-xl text-gray-100">
                                        {revenue.toFixed(2)} ريال
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        );
    };

    const ProfitDetailsCard = () => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-200">تفاصيل الأرباح الشهرية</h2>
                        <button
                            onClick={() => setShowProfitDetails(false)}
                            className="text-gray-400 hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(stats.monthlyProfit)
                            .sort((a, b) => b[0].localeCompare(a[0]))
                            .map(([monthKey, profit]) => (
                                <div key={monthKey} className="bg-gray-700 p-4 rounded-lg">
                                    <h3 className="text-gray-200 mb-2">{formatMonthKey(monthKey)}</h3>
                                    <p className="text-xl text-gray-100">
                                        {profit.toFixed(2)} ريال
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    const gradients = [
        ['#000000', '#0D9488'],
        ['#000000', '#2D3748'],
        ['#000000', '#514A9D'],
        ['#000000', '#B45309'],
        ['#000000', '#870000'],
        ['#000000', '#21579e'],
        ['#000000', '#2E7D32'],
        ['#000000', '#C62828'],
        ['#000000', '#4527A0'],
    ];

    const StatCard = ({ title, value, icon, gradient, showCurrency = false, onClick }) => (
        <div
            className="rounded-lg shadow-lg p-7 h-full flex flex-col justify-between transform transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{
                background: `linear-gradient(to right, ${gradient[0]}, ${gradient[1]})`
            }}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-200">{title}</h2>
                {icon}
            </div>
            <p className="text-2xl font-bold text-gray-100">
                {parseFloat(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                {showCurrency && " ريال"}
            </p>
        </div>
    );

    return (
        <div className="container mx-auto py-4 pb-6 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-200">لوحة التحكم</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard
                    title="إجمالي الإيرادات"
                    value={stats.totalRevenue}
                    icon={<FaDollarSign className="text-3xl text-teal-600" />}
                    gradient={gradients[0]}
                    showCurrency={true}
                    onClick={handleTotalRevenueClick}
                />
                <StatCard
                    title="إيرادات هذا الشهر"
                    value={stats.thisMonthRevenue}
                    icon={<FaChartLine className="text-3xl text-yellow-400" />}
                    gradient={gradients[3]}
                    showCurrency={true}
                />
                <StatCard
                    title="إيرادات الشهر الماضي"
                    value={stats.lastMonthRevenue}
                    icon={<FaChartLine className="text-3xl text-red-400" />}
                    gradient={gradients[4]}
                    showCurrency={true}
                />
                <StatCard
                    title="إجمالي الأرباح"
                    value={stats.totalProfit}
                    icon={<FaMoneyBillWave className="text-3xl text-sky-800" />}
                    gradient={gradients[5]}
                    showCurrency={true}
                    onClick={handleTotalProfitClick}
                />
                <StatCard
                    title="أرباح هذا الشهر"
                    value={stats.thisMonthProfit}
                    icon={<FaMoneyBillWave className="text-3xl text-green-600" />}
                    gradient={gradients[6]}
                    showCurrency={true}
                />
                <StatCard
                    title="أرباح الشهر الماضي"
                    value={stats.lastMonthProfit}
                    icon={<FaMoneyBillWave className="text-3xl text-red-600" />}
                    gradient={gradients[7]}
                    showCurrency={true}
                />
                <StatCard
                    title="إجمالي الطلبات"
                    value={stats.totalOrders}
                    icon={<FaClipboardList className="text-3xl text-zinc-500" />}
                    gradient={gradients[1]}
                    onClick={() => handleCardClick('/orders')}
                />
                <StatCard
                    title="العملاء"
                    value={stats.uniqueCustomers}
                    icon={<FaUsers className="text-3xl text-purple-400" />}
                    gradient={gradients[2]}
                    onClick={() => handleCardClick('/customers')}
                />
                <StatCard
                    title="الطلبات الجديدة"
                    value={stats.newOrders}
                    icon={<FaBoxOpen className="text-3xl text-purple-600" />}
                    gradient={gradients[8]}
                    onClick={() => handleCardClick('/orders?filter=new')}
                />
            </div>

            {showRevenueDetails && <RevenueDetailsCard />}
            {showProfitDetails && <ProfitDetailsCard />}
        </div>
    );
}
