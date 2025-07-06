import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";
import { LayoutGridIcon, LogOut, UserCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Nav() {
  const activeLink = "rounded-lg bg-glas flex text-lg items-center font-semibold p-4 gap-2 mt-7";
  const inactiveLink = "flex items-center text-lg pt-7 gap-2";
  const activeLinkicon = "size-7";
  const inactiveLinkicon = "size-6";
  const router = useRouter();
  const { pathname } = router;

  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/orders');
        const orders = response.data;

        // Calculate the number of new orders based on the 'viewed' property
        const newOrders = orders.filter(order => !order.viewed);
        setNewOrdersCount(newOrders.length);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const Logout = async () => {
    try {
      // Delete the user
      const response = await fetch("/api/deleteUser", {
        method: "DELETE",
      });

      if (response.ok) {
        // If the user was successfully deleted, sign out
        await signOut({ callbackUrl: "/" });
      } else {
        console.error("Failed to delete user");
        // You can add error handling here
      }
    } catch (error) {
      console.error("Error during sign out:", error);
      // You can add error handling here
    }
  };

  return (
    <nav className="fixed p-6 pl-4 m-2 bg-glass rounded-lg h-[600px] w-54 overflow-y-auto ">
      <Link href="/" className="flex" legacyBehavior>
        <a className="">
          <Image src="/logo.png" alt="Logo" width={128} height={32} className="pr-7 mb-3 items-center" />
        </a>
      </Link>
      <nav className="p-3">
        <Link href="/" legacyBehavior>
          <a className={pathname === "/" ? activeLink : inactiveLink}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={pathname === "/" ? activeLinkicon : inactiveLinkicon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            لوحة التحكم
          </a>
        </Link>
        <Link href="/products" legacyBehavior>
          <a className={pathname && pathname.includes("/products") ? activeLink : inactiveLink}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={pathname && pathname.includes("/products") ? activeLinkicon : inactiveLinkicon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            المنتجات
          </a>
        </Link>
        <Link href='/categories' legacyBehavior>
          <a className={pathname && pathname.includes("/categories") ? activeLink : inactiveLink}>
            <LayoutGridIcon className={pathname && pathname.includes("/categories") ? activeLinkicon : inactiveLinkicon}/>
            الفئات
          </a>
        </Link>
        <Link href="/orders" legacyBehavior>
          <a className={pathname && pathname.includes("/orders") ? activeLink : inactiveLink} style={{ position: 'relative' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={pathname && pathname.includes("/orders") ? activeLinkicon : inactiveLinkicon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
            الطلبات
            {newOrdersCount > 0 && (
              <span className={`absolute ${pathname && pathname.includes("/orders") ? 'top-2 right-2 h-5 w-5' : 'top-6 -right-1 h-4 w-4'} bg-red-500 text-white text-sm font-bold rounded-full  flex items-center justify-center`}>
                {newOrdersCount}
              </span>
            )}
          </a>
        </Link>
        <Link href="/customers" legacyBehavior>
          <a className={pathname && pathname.includes("/customers") ? activeLink : inactiveLink}>
            <UserCircle2/>
            العملاء
          </a>
        </Link>
        <button onClick={Logout} legacyBehavior>
          <a className={pathname && pathname.includes("/Logout") ? activeLink : inactiveLink}>
            <LogOut/>
            تسجيل الخروج
          </a>
        </button>
      </nav>
    </nav>
  );
}
