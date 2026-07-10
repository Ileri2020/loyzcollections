"use client";

import { toggleWishlist, checkWishlisStatus } from "@/action/wishlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getProductPrice, isProductInStock } from "@/lib/stock-pricing";
import { Heart, ShoppingCart, Star, Edit3, Trash2, Tag } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductForm from "@/prisma/forms/ProductForm";
import axios from "axios";
import { toast } from "sonner";

type ProductCardProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onError"
> & {
  orientation?: "vertical" | "horizontal";
  onAddToCart?: (product: any) => void;
  onAddToWishlist?: (productId: string) => void;
  product: any;
  variant?: "compact" | "default";
  showDiscount?: boolean; // ✅ NEW PROP
};

export function ProductCard({
  className,
  orientation = "vertical",
  onAddToCart,
  onAddToWishlist,
  product,
  variant = "default",
  showDiscount = false, // ✅ default false
  ...props
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isAddingToCart, setIsAddingToCart] = React.useState(false);
  const [isInWishlist, setIsInWishlist] = React.useState(false);

  React.useEffect(() => {
    if (product?.id) {
      checkWishlisStatus(product.id)
        .then((status) => setIsInWishlist(status))
        .catch(() => { });
    }
  }, [product?.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      setIsAddingToCart(true);
      setTimeout(() => {
        onAddToCart(product);
        setIsAddingToCart(false);
      }, 600);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    const startState = isInWishlist;
    setIsInWishlist(!startState);
    try {
      await toggleWishlist(product.id);
      if (onAddToWishlist) {
        onAddToWishlist(product.id);
      }
    } catch (err) {
      setIsInWishlist(startState);
    }
  };

  /**
   * Safe Data Access
   */
  const currentPrice = getProductPrice(product);
  const inStock = typeof product.inStock === 'boolean' ? product.inStock : isProductInStock(product);

  const totalSold = React.useMemo(() => {
    if (!product.cartItems || product.cartItems.length === 0) return 0;
    return product.cartItems.reduce((total: number, item: any) => {
      const isPaid = item.cart?.status === "paid" || item.cart?.status === "completed";
      return total + (isPaid ? (item.quantity || 0) : 0);
    }, 0);
  }, [product.cartItems]);

  const isSold = totalSold > 0;

  const categoryName = product?.category?.name || "Product";
  const image = product?.images?.[0] || "/placeholder.png";

  // Rating Logic
  const ratingValue = React.useMemo(() => {
    if (typeof product.rating === 'number') return product.rating;
    if (Array.isArray(product.reviews) && product.reviews.length > 0) {
      const total = product.reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
      return total / product.reviews.length;
    }
    return 0;
  }, [product]);

  const hasDiscount = showDiscount && (product.discount ?? 0) > 0;
  const discountPercent = hasDiscount ? product.discount : 0;
  const originalPrice = currentPrice;
  const discountedPrice = hasDiscount
    ? currentPrice * (1 - discountPercent / 100)
    : currentPrice;

  const renderStars = () => {
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue % 1 >= 0.5;

    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={`star-${product.id}-${i}`}
            className={cn(
              "h-4 w-4",
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "stroke-muted/40 text-muted"
            )}
          />
        ))}
        {ratingValue > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            {ratingValue.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  const isAdmin = useIsAdmin();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  const handleDeleteProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await axios.delete(`/api/dbhandler?model=product&id=${product.id}`);
        toast.success("Product deleted successfully");
        window.location.reload(); // Refresh to show changes
      } catch (err) {
        toast.error("Failed to delete product");
      }
    }
  };

  return (
    <div className={cn("group relative", className)} {...props}>
      {/* Admin Actions */}
      {isAdmin && (
        <div className="absolute top-2 left-2 flex gap-2 z-30">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Edit Product: {product.name}</DialogTitle>
              </DialogHeader>
              <ProductForm initialProduct={product} hideList={true} />
            </DialogContent>
          </Dialog>

          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8 rounded-full bg-destructive/80 backdrop-blur-sm shadow-sm"
            onClick={handleDeleteProduct}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Link href={`/store/${product.id}`}>
        <Card
          className={cn(
            `
              relative w-full overflow-clip rounded-lg py-0 transition-all
              duration-200 ease-in-out
              shadow-md m-1 flex md:flex-col
            `,
            orientation === "horizontal" ? "flex-row" : "flex-col",
            isHovered && "ring-1 ring-primary/20"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image */}
          <div
            className={cn(
              "relative aspect-square overflow-hidden rounded-t-lg flex justify-center items-center bg-muted md:w-full",
              orientation === "horizontal" ? "w-[40%]" : "w-full"
            )}
          >
            <img
              alt={product?.name || "Product"}
              className={cn(
                "object-cover w-full transition-transform duration-300 ease-in-out",
                isHovered ? "scale-100" : "scale-110"
              )}
              src={image}
            />

            {/* Category badge moved to bottom-left */}
            <Badge
              className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm z-10"
              variant="outline"
            >
              {categoryName}
            </Badge>

            {/* Discount badge */}
            {hasDiscount && (
              <Badge
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground"
              >
                {discountPercent}% OFF
              </Badge>
            )}

            {/* Wishlist */}
            <Button
              className={cn(
                `
                  absolute right-2 bottom-2 z-10 rounded-full bg-background/80
                  backdrop-blur-sm transition-opacity duration-300
                `,
                !isHovered && !isInWishlist && "opacity-0"
              )}
              onClick={handleAddToWishlist}
              size="icon"
              type="button"
              variant="outline"
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isInWishlist
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground"
                )}
              />
            </Button>
          </div>

          <div className="w-full flex-1">
            <CardContent className="p-4 pt-2">
              <h3 className="line-clamp-2 text-base font-semibold group-hover:text-primary">
                {product?.name || "Product Name"}
              </h3>

              {variant === "default" && (
                <>
                  <div className="mt-1.5">{renderStars()}</div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="font-medium text-foreground">
                      ₦{discountedPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₦{originalPrice.toFixed(2)} has
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>

            {variant === "default" && (
              <CardFooter className="p-4 pt-0">
                <Button
                  className={cn(
                    "w-full gap-2 transition-all dark:text-primary",
                    isAddingToCart && "opacity-70"
                  )}
                  disabled={isAddingToCart || !inStock}
                  onClick={handleAddToCart}
                >
                  {isAddingToCart ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  Add to Cart
                </Button>
              </CardFooter>
            )}

            {variant === "compact" && (
              <CardFooter className="p-4 pt-0">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">
                      ₦{discountedPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        ₦{originalPrice.toFixed(2)} has
                      </span>
                    )}
                  </div>
                  <Button
                    className="h-8 w-8 rounded-full"
                    disabled={isAddingToCart || !inStock}
                    onClick={handleAddToCart}
                    size="icon"
                    variant="ghost"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            )}

            {!inStock && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                {isSold ? (
                  <div className="flex flex-col items-center gap-1.5 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive border-2 border-destructive/20 shadow-sm">
                      <Tag className="h-5 w-5" />
                    </div>
                    <Badge className="px-3 py-1 text-sm font-semibold tracking-wide uppercase shadow-sm" variant="destructive">
                      Sold Out
                    </Badge>
                  </div>
                ) : (
                  <Badge className="px-3 py-1 text-sm" variant="destructive">
                    Out of Stock
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  );
}
