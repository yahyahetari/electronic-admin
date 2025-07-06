import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import Loader from "@/components/Loader";

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); // حالة البحث
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // حالة الصفحة الحالية
    const customersPerPage = 10; // عدد العملاء في كل صفحة
    const router = useRouter();

    useEffect(() => {
        // استرداد البيانات عند التحميل الأولي أو عند تغيير الصفحة
        const fetchCustomers = async () => {
            try {
                const response = await axios.get('/api/customers');
                setCustomers(response.data);
            } catch (error) {
                console.error("Error fetching customers:", error);
                setError("Failed to load customers. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchCustomers();

        // استرداد حالة البحث والصفحة من الرابط
        if (router.query.search) setSearchTerm(router.query.search);
        if (router.query.page) setCurrentPage(parseInt(router.query.page, 10));
    }, [router.query.search, router.query.page]);

    const handleCustomerClick = (customerId) => {
        // عند الانتقال لصفحة العميل، احتفظ بحالة البحث والصفحة
        router.push({
            pathname: `/customer/${customerId}`,
            query: { search: searchTerm, page: currentPage }
        });
    };

    const filteredCustomers = customers.filter(customer =>
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
    const indexOfLastCustomer = currentPage * customersPerPage;
    const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader />
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-center text-xl">{error}</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-200">العملاء</h1>
            
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="البحث عن العملاء..."
                    className="p-2 border border-gray-400 rounded w-full text-xl"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto bg-glass shadow-lg rounded-lg">
                <div className="inline-block min-w-full">
                    <div className="overflow-hidden">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr>
                                    <th className="px-5 py-3 border-gray-200 bg-glass text-center text-xl text-gray-300  ">
                                        الاسم
                                    </th>
                                    <th className="px-5 py-3 border-gray-200 bg-glass text-center text-xl text-gray-300  ">
                                        الإيميل
                                    </th>
                                    <th className="px-5 py-3 border-gray-200 bg-glass text-center text-xl text-gray-300  ">
                                    مُنْفَق 
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentCustomers.map(customer => (
                                    <tr key={customer._id} className="hover:bg-glass items-center justify-center">
                                        <td className="px-5 py-5 border-gray-200 bg-glass text-lg whitespace-nowrap">
                                            <a 
                                                href="#" 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleCustomerClick(customer._id);
                                                }}
                                                className="text-blue-300 hover:text-red-800 hover:font-bold"
                                            >
                                                {customer.firstName} {customer.lastName}
                                            </a>
                                        </td>
                                        <td className="px-5 py-5 border-gray-200 bg-glass text-lg whitespace-nowrap">
                                            {customer.email}
                                        </td>
                                        <td className="px-5 py-5 border-gray-200 bg-glass text-lg whitespace-nowrap">
                                            {customer.totalSpent.toFixed(2)} ريال
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredCustomers.length === 0 && (
                            <div className="p-4 text-center text-gray-300">
                                لا يوجد عملاء.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-4">
                <button 
                    onClick={() => {
                        const newPage = Math.max(currentPage - 1, 1);
                        setCurrentPage(newPage);
                        router.push({
                            pathname: router.pathname,
                            query: { search: searchTerm, page: newPage }
                        });
                    }} 
                    disabled={currentPage === 1} 
                    className="bg-h-glass text-white px-4 py-2 rounded disabled:bg-glass">
                    الصفحة السابقة
                </button>
                <button 
                    onClick={() => {
                        const newPage = Math.min(currentPage + 1, totalPages);
                        setCurrentPage(newPage);
                        router.push({
                            pathname: router.pathname,
                            query: { search: searchTerm, page: newPage }
                        });
                    }} 
                    disabled={currentPage === totalPages} 
                    className="bg-h-glass text-white px-4 py-2 rounded disabled:bg-glass">
                    الصفحة التالية
                </button>
            </div>
        </div>
    );
}
