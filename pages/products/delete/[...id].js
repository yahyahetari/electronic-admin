import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import axios from "axios";

export default function DeleteProductPage() {
  const router = useRouter();
  const [productInfo, setProductInfo] = useState();
  const {id, page} = router.query;

  useEffect(() => {
    if (!id) {
      return;
    }
    axios.get('/api/products?id='+id).then(response => {
      setProductInfo(response.data);
    });
  }, [id]);

  function goBack() {
    router.push(`/products?page=${page || 1}`);
  }

  async function deleteProduct() {
    await axios.delete('/api/products?id='+id);
    goBack();
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="max-w-sm p-6 bg-opacity-30 backdrop-blur-md border bg-h-glass border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-red-900 dark:text-white">حذف المنتج</h5>
        <p className="mb-4 text-gray-900 text-lg font-semibold dark:text-gray-400">
        هل أنت متأكد أنك تريد حذف <span className="text-xl text-red-800 font-semibold">{productInfo?.title}</span> ؟ لا يمكن التراجع عن هذا الإجراء .
        </p>
        <div className="flex justify-between">
          <button type="button" onClick={deleteProduct} className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-lg px-4 py-2 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-800">حذف</button>
          <button type="button" onClick={goBack} className="text-gray-900 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-lg px-4 py-2 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-500">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
