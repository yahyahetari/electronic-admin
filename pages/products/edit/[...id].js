import ProductForm from "@/components/ProductForm";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function EditProduct(){
    const [productInfo, setProductInfo] = useState(null);
    const router = useRouter();
    const {id, page} = router.query;

    useEffect(() => {
        if (!id){
            return;
        }
        axios.get('/api/products?id='+id).then(
            (response) => {
                setProductInfo(response.data);
            }
        )
    }, [id])

    async function handleSubmit(ev, data) {
        ev.preventDefault();
        await axios.put('/api/products', { ...data, _id: id });
        router.push(`/products?page=${page || 1}`);
    }

    return (
        <div>
            <h1 className="p-2 text-3xl">تعديل المنتج</h1>
            {productInfo && (
                <ProductForm {...productInfo} onSubmit={handleSubmit} />
            )}
        </div>
    )
}
