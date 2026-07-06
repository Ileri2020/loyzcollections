"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ProductCard } from "./productCard";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FeaturedProductForm from "@/prisma/forms/FeaturedProductForm";

/* ===============================
   Types
================================ */
export interface FeaturedProductType {
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

/* ===============================
   Component
================================ */
const FeaturedProducts = () => {
  const [products, setProducts] = useState<FeaturedProductType[]>([]);
  const [loading, setLoading] = useState(true);

  /* Autoplay plugins */
  const autoplayLTR = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: false })
  );

  const autoplayRTL = useRef(
    Autoplay({ delay: 2800, stopOnInteraction: false })
  );

  /* ===============================
     Fetch + Normalize Data
  ================================ */
  const isAdmin = useIsAdmin();

  async function fetchFeaturedProducts() {
    try {
      const res = await fetch("/api/dbhandler?model=featuredProduct");
      const data = await res.json();

      const mapped: FeaturedProductType[] = data.map((item: any) => {
        const totalStock =
          !item.product.stock || item.product.stock.length === 0
            ? 1
            : item.product.stock.reduce(
              (sum: number, s: any) => sum + (s.addedQuantity ?? 0),
              0
            );

        const totalSold =
          item.product.cartItems?.reduce(
            (sum: number, ci: any) => {
              const isPaid = ci.cart?.status === "paid" || ci.cart?.status === "completed";
              return sum + (isPaid ? ci.quantity : 0);
            },
            0
          ) ?? 0;

        const rating =
          item.product.reviews?.length > 0
            ? item.product.reviews.reduce(
              (acc: number, r: any) => acc + r.rating,
              0
            ) / item.product.reviews.length
            : undefined;

        return {
          id: item.product.id,
          name: item.product.name,
          category: {
            name: item.product.category.name,
          },
          price: item.product.price,
          images:
            item.product.images?.length > 0
              ? item.product.images
              : ["/placeholder.png"],
          inStock: (totalStock - totalSold) > 0,
          rating,
          stock: item.product.stock,
          cartItems: item.product.cartItems,
        };
      });

      setProducts(mapped);
    } catch (err) {
      console.error("Failed to fetch featured products", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  /* ===============================
     Split products for dual carousel
     – Distribute alternately for balance
  ================================ */
  const [topRow, bottomRow] = useMemo(() => {
    const top: FeaturedProductType[] = [];
    const bottom: FeaturedProductType[] = [];
    products.forEach((p, i) => {
      if (i % 2 == 0) top.push(p);
      else bottom.push(p);
    });
    return [top, bottom];
  }, [products]);

  /* ===============================
     Cart Hook
  ================================ */
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: FeaturedProductType) => {
    // Map FeaturedProductType to the structure expected by cart if necessary
    // Assuming cart expects { id, name, price, images, ... } which FeaturedProductType has
    addItem(product as any, 1);
    toast({
      description: `${product.name} added to cart`,
      duration: 2000,
    });
  };

  return (
    <section className="bg-muted/50 py-12 md:py-16 overflow-hidden">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Featured Products
          </h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Hand-picked products customers love most
          </p>

          {isAdmin && (
            <div className="mt-6">
              <Dialog onOpenChange={(open) => !open && fetchFeaturedProducts()}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Manage Featured Products
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Featured Products</DialogTitle>
                  </DialogHeader>
                  <FeaturedProductForm hideList={true} />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-8">
            {/* ===============================
                TOP CAROUSEL (LTR)
            ================================ */}
            <Carousel
              opts={{ loop: true }}
              plugins={[autoplayLTR.current]}
              className="w-screen max-w-screen-md mx-auto"
            >
              <CarouselContent>
                {topRow.map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="basis-1/2 md:basis-1/4 /lg:basis-1/7  px-3"
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* ===============================
                BOTTOM CAROUSEL (RTL)
            ================================ */}
            <Carousel
              opts={{ loop: true }}
              plugins={[autoplayRTL.current]}
              className="w-screen  max-w-screen-md mx-auto"
            >
              <CarouselContent>
                {bottomRow.map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="basis-1/2 md:basis-1/4 px-3"
                  >
                    <ProductCard
                      product={product}
                      onAddToCart={() => handleAddToCart(product)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link href="/store">
            <Button
              variant="outline"
              size="lg"
              className="group h-12 px-8 border-2"
            >
              View All Products
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
