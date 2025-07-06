import axios from "axios";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe, FaShoppingCart, FaDollarSign } from 'react-icons/fa';

export default function Customer() {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        const fetchCustomer = async () => {
            if (id) {
                try {
                    const response = await axios.get(`/api/customers/${id}`);
                    setCustomer(response.data);
                } catch (error) {
                    console.error("Error fetching customer:", error);
                    setError("Failed to load customer details. Please try again.");
                } finally {
                    setLoading(false);
                }
            }
        };
        
        fetchCustomer();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 text-xl"></div>
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

    if (!customer) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded" role="alert">
                    <p className="font-bold">لم يتم العثور على بيانات العميل</p>
                    <p>ID: {id}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-2 py-2">
            <h1 className="text-2xl font-medium mb-6 text-gray-200 text-center ">بيانات العميل</h1>
            <div className="bg-glass rounded-lg shadow-lg p-6 mb-6 ">
                <div className="grid md:grid-cols-2 gap-6 ">
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-200">معلومات شخصية</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center"><FaUser className="ml-2 text-blue-400 text-xl" /> {customer.firstName} {customer.lastName}</li>
                            <li className="flex items-center"><FaEnvelope className="ml-2 text-blue-400 text-xl" /> {customer.email}</li>
                            <li className="flex items-center"><FaPhone className="ml-2 text-blue-400 text-xl" /> {customer.phone}</li>
                            <li className="flex items-center"><FaMapMarkerAlt className="ml-2 text-blue-400 text-xl" /> {customer.address}, {customer.city}, {customer.country}</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-200">ملخص الطلبات</h3>
                        <ul className="space-y-2">
                            <li className="flex text-lg items-center"><FaShoppingCart className="ml-2 text-blue-400 text-xl" /> مجموع الطلبات : {customer.orderCount}</li>
                            <li className="flex text-lg items-center"><FaDollarSign className="ml-2 text-blue-400 text-xl" /> مجموع الإنفاق : {customer.totalSpent.toFixed(2)} ريال</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
