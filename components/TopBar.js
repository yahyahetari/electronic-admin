import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { LayoutGridIcon, LogOut, Menu, UserCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";
import axios from "axios";

// تعريف روابط التنقل باللغة العربية
const navLinks = [
  { url: "/", label: "لوحة التحكم", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg> },
  { url: "/products", label: "المنتجات", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg> },
  { url: "/categories", label: "الفئات", icon: <LayoutGridIcon className="w-6 h-6" /> },
  { url: "/orders", label: "الطلبات", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg> },
  { url: "/customers", label: "العملاء", icon: <UserCircle2 className="w-6 h-6" /> },
];

export default function TopBar() {
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const { pathname } = useRouter();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      setDropdownMenu(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/orders');
        const orders = response.data;

        const newOrders = orders.filter(order => !order.viewed);
        setNewOrdersCount(newOrders.length);
        setHasNewOrders(newOrders.length > 0);
      } catch (error) {
        console.error("خطأ في جلب الطلبات:", error);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = () => {
    setDropdownMenu(!dropdownMenu);
    if (hasNewOrders) {
      setHasNewOrders(false);
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/'
      });
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  return (
    <div className="sticky top-0 z-20 w-full flex items-center px-4 py-2 bg-blue-2 shadow-xl">
      <Image src="/logo.png" alt="شعار" width={90} height={30} />

      <div className="lg:hidden relative mr-auto flex gap-4 items-center">
        <div className="relative">
          <Menu className="cursor-pointer" onClick={handleMenuClick} />
          {hasNewOrders && (
            <span className="absolute -top-1 -left-0.5 pb-1 bg-red-500 text-white text-base font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {newOrdersCount}
            </span>
          )}
        </div>
        {dropdownMenu && (
          <div className="absolute top-12 left-0 flex flex-col gap-4 p-5 bg-glass shadow-xl rounded-lg min-w-[200px]">
            {navLinks.map((link) => (
              <Link 
                href={link.url} 
                key={link.label} 
                className={`flex items-center gap-2 text-body-medium whitespace-nowrap ${
                  pathname === link.url 
                    ? "rounded-lg bg-glass text-lg font-semibold p-2" 
                    : "text-grey-1"
                }`} 
              >
                <span className="flex-shrink-0">{link.icon}</span>
                <span className="truncate">{link.label}</span>
                {link.label === "الطلبات" && newOrdersCount > 0 && (
                  <span className="bg-red-500 text-white text-sm pb-1.5 font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                    {newOrdersCount}
                  </span>
                )}
              </Link>
            ))}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-body-medium text-grey-1 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-6 h-6 flex-shrink-0" />
              <span className="truncate">تسجيل الخروج</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}