'use client';

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import axios from "axios";
import { ProductCard } from "./productCard";
import { useCart } from "@/hooks/use-cart";
import { Skeleton } from "@/components/ui/skeleton";

type StocksProps = {
  categoryFilter?: string;
  search?: string;
  selectedId?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: any;
  rating?: number;
  stock?: any[];
  cartItems?: any[];
};

import { useAppContext } from "@/hooks/useAppContext";

const Stocks = ({ categoryFilter, search, selectedId }: StocksProps) => {
  const { addItem } = useCart();
  const { openDialog } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/dbhandler?model=product");
      let fetchedProducts: Product[] = res.data;

      // Filter and prioritize
      let prioritized: Product[] = [];

      // 1️⃣ Product by selectedId first
      if (selectedId) {
        const selectedProduct = fetchedProducts.find(p => p.id === selectedId);
        if (selectedProduct) prioritized.push(selectedProduct);
      }

      // 2️⃣ Products whose name contains search
      if (search) {
        const searchMatches = fetchedProducts.filter(
          p => p.name.toLowerCase().includes(search.toLowerCase()) &&
            p.id !== selectedId
        );
        prioritized.push(...searchMatches);
      }

      // 3️⃣ Products in same category
      if (categoryFilter) {
        const categoryMatches = fetchedProducts.filter(
          p =>
            p.category?.name?.toLowerCase() === categoryFilter.toLowerCase() &&
            p.id !== selectedId &&
            !(search && p.name.toLowerCase().includes(search.toLowerCase()))
        );
        prioritized.push(...categoryMatches);
      }


      // If nothing matches, fallback to all products
      if (prioritized.length === 0) {
        prioritized = fetchedProducts.sort(() => Math.random() - 0.5);
      }

      setProducts(prioritized);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch products, please check your network connection");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, search, selectedId]);

  if (loading) {
    return (
      <div className="h-full max-w-[500px] md:max-w-[1000px] flex gap-5 flex-wrap relative p-2 mx-auto justify-between">
        <div className="absolute w-full h-full flex justify-center items-center z-10 bg-black/30 p-2">
          {error && <p className="w-full text-center text-white">{error}</p>}
        </div>
        {[...Array(8)].map((_, index) => (
          <Skeleton
            key={index}
            className="w-[100vw] md:w-[200px] h-[150px] md:h-[300px] mb-5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full max-w-[500px] md:max-w-[1000px] flex gap-5 flex-wrap mx-5 p-2 self-center justify-between">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{
            ...product,
            rating: product.rating ?? 5,
          }}
          orientation="horizontal"
          onAddToCart={addItem}
          onAddToWishlist={(id) => openDialog(`Add ${id} to wishlist`, "Wishlist")}
          className="w-[100vw] md:w-[200px] mb-5 flex flex-row md:flex-col"
        />
      ))}
    </div>
  );
};

export default Stocks;
