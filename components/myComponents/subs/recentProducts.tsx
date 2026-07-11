"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { ProductCard } from "./productCard";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";

export interface RecentProductType {
  id: string;
  name: string;
  category: {
    name: string;
  };
  price: number;
  images: string[];
  inStock: boolean;
  rating?: number;
  stock?: any[];
  cartItems?: any[];
}

const RecentProducts = () => {
  const [products, setProducts] = useState<RecentProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const autoplay = useRef(Autoplay({ delay: 2800, stopOnInteraction: false }));
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: RecentProductType) => {
    addItem(product as any, 1);
    toast({
      description: `${product.name} added to cart`,
      duration: 2000,
    });
  };

  async function fetchRecentProducts() {
    try {
      const res = await fetch("/api/dbhandler?model=product&limit=12");
      const data = await res.json();
      const mapped: RecentProductType[] = data.map((item: any) => {
        const totalStock =
          !item.stock || item.stock.length === 0
            ? 1
            : item.stock.reduce(
                (sum: number, s: any) => sum + (s.addedQuantity ?? 0),
                0
              );

        const totalSold =
          item.cartItems?.reduce(
            (sum: number, ci: any) => {
              const isPaid =
                ci.cart?.status === "paid" || ci.cart?.status === "completed";
              return sum + (isPaid ? ci.quantity : 0);
            },
            0
          ) ?? 0;

        const rating =
          item.reviews?.length > 0
            ? item.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) /
              item.reviews.length
            : undefined;

        return {
          id: item.id,
          name: item.name,
          category: { name: item.category?.name || "General" },
          price: item.price,
          images: item.images?.length > 0 ? item.images : ["/placeholder.png"],
          inStock: totalStock - totalSold > 0,
          rating,
          stock: item.stock,
          cartItems: item.cartItems,
        };
      });
      setProducts(mapped);
    } catch (err) {
      console.error("Failed to fetch recent products", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecentProducts();
  }, []);

  return (
    <section className="bg-background py-12 md:py-16 overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Recent Products</h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
          <p className="mt-4 max-w-2xl text-muted-foreground">
            See the newest arrivals added to our store.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : (
          <Carousel
            opts={{ loop: true }}
            plugins={[autoplay.current]}
            className="w-screen max-w-screen-md mx-auto"
          >
            <CarouselContent>
              {products.map((product) => (
                <CarouselItem key={product.id} className="basis-1/2 md:basis-1/4 px-3">
                  <ProductCard product={product} onAddToCart={() => handleAddToCart(product)} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}

        <div className="mt-12 flex justify-center">
          <Link href="/store">
            <Button variant="outline" size="lg" className="group h-12 px-8 border-2">
              Browse All New Products
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RecentProducts;
