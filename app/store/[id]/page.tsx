"use client";

import { Minus, Plus, ShoppingCart, Star, Edit, Trash, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import axios from "axios";

import { useCart } from "@/hooks/use-cart";
import { useAppContext } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import Similar from "@/components/myComponents/subs/similar";
import { ProductCard } from "@/components/myComponents/subs/productCard";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface Product {
  id: string;
  name: string;
  description: string;
  category: any;
  image: string[];
  price: number;
  originalPrice?: number;
  rating: number;
  inStock: boolean;
  features: string[];
  specs: Record<string, string>;
}

/* -------------------------------------------------------------------------- */

const CURRENCY = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

/* -------------------------------------------------------------------------- */

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const { user } = useAppContext();

  const [product, setProduct] = React.useState<Product | null>(null);
  const [rawProduct, setRawProduct] = React.useState<any>(null);
  const [allProducts, setAllProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);

  // Image Navigation State
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  // Admin Edit States
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [newDescription, setNewDescription] = React.useState("");
  const [newImageFile, setNewImageFile] = React.useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [isAddImageOpen, setIsAddImageOpen] = React.useState(false);


  /* ----------------------------- Fetch product ----------------------------- */

  const fetchProduct = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/dbhandler?model=product&id=${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error("Fetch failed");

      setRawProduct(data);

      /** ✅ FIX: calculate stock correctly */
      const totalStock =
        !data.stock || data.stock.length === 0
          ? 1
          : data.stock.reduce(
            (sum: number, s: any) => sum + (s.addedQuantity ?? 0),
            0
          );

      const totalSold =
        Array.isArray(data.cartItems)
          ? data.cartItems.reduce(
            (sum: number, item: any) => {
              const isPaid = item.cart?.status === "paid" || item.cart?.status === "completed";
              return sum + (isPaid ? item.quantity : 0);
            },
            0
          )
          : 0;

      const transformed: Product = {
        id: data.id,
        name: data.name,
        description: data.description || "",
        category: data.category,
        image: data.images || [],
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        rating: data.reviews?.length
          ? data.reviews.reduce(
            (acc: number, r: any) => acc + r.rating,
            0
          ) / data.reviews.length
          : 0,
        inStock: (totalStock - totalSold) > 0,
        features: [],
        specs: {},
      };

      setProduct(transformed);
      // Only reset description if not editing, or always? 
      // It's safer to always reset on fetch unless we want to persist unsaved edits across polls.
      // But we are only fetching once or after save.
      setNewDescription(transformed.description);

      // Only fetch recommendations once
      if (allProducts.length === 0) {
        const all = await fetch(`/api/dbhandler?model=product`);
        setAllProducts(await all.json());
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [id, allProducts.length]);

  React.useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  /* ----------------------------- Cart helpers ------------------------------ */

  const cartItem = React.useMemo(
    () => items.find((i) => i.id === id),
    [items, id]
  );

  const quantity = cartItem?.quantity ?? 0;

  const handleDecrease = () => {
    if (!product) return;
    if (quantity <= 1) return removeItem(product.id);
    updateQuantity(product.id, quantity - 1);
  };

  const handleIncrease = () => {
    if (!product) return;
    if (quantity === 0) return addItem(rawProduct, 1);
    updateQuantity(product.id, quantity + 1);
  };

  const handleAddToCart = async () => {
    if (!product || !product.inStock) return;
    setIsAdding(true);
    addItem(rawProduct, 1);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setIsAdding(false), 400);
  };

  /* ----------------------------- Admin Actions ----------------------------- */
  const isAdmin = user?.role === 'admin';

  const handleSaveDescription = async () => {
    if (!product) return;
    try {
      await axios.put(`/api/dbhandler?model=product&id=${product.id}`, {
        description: newDescription,
      });
      toast.success("Description updated successfully");
      setIsEditingDescription(false);
      fetchProduct(); // Refresh data
    } catch (error) {
      console.error("Failed to update description", error);
      toast.error("Failed to update description");
    }
  };

  const handleAddImage = async () => {
    if (!newImageFile || !product) return;
    setUploadingImage(true);

    try {
      // 1. Upload image to server/cloudinary
      const formData = new FormData();
      formData.append("file", newImageFile);
      formData.append("description", "Product Image");
      formData.append("type", "image");
      formData.append("userId", user.id);
      formData.append("title", product.name);
      formData.append("for", "product");

      // Assuming this endpoint returns { url: string } or similar
      const uploadRes = await axios.post(`/api/file/image`, formData);

      if (uploadRes.status === 200) {
        const newImageUrl = uploadRes.data.url;

        // 2. Update product content with new image URL appended
        const updatedImages = [...product.image, newImageUrl];
        await axios.put(`/api/dbhandler?model=product&id=${product.id}`, {
          images: updatedImages,
        });

        toast.success("Image added successfully");
        setIsAddImageOpen(false);
        setNewImageFile(null);
        fetchProduct();
      } else {
        toast.error("Image upload failed");
      }
    } catch (error) {
      console.error("Failed to add image", error);
      toast.error("Failed to add image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (indexToDelete: number) => {
    if (!product) return;
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const updatedImages = product.image.filter((_, idx) => idx !== indexToDelete);
      await axios.put(`/api/dbhandler?model=product&id=${product.id}`, {
        images: updatedImages,
      });
      toast.success("Image removed");
      // Adjust index if needed
      if (currentImageIndex >= updatedImages.length && updatedImages.length > 0) {
        setCurrentImageIndex(updatedImages.length - 1);
      } else if (updatedImages.length === 0) {
        setCurrentImageIndex(0);
      }
      fetchProduct();
    } catch (error) {
      console.error("Failed to delete image", error);
      toast.error("Failed to delete image");
    }
  };


  /* ----------------------------- Image Carousel Logic --------------------- */

  const nextImage = () => {
    if (!product || product.image.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % product.image.length);
  };

  const prevImage = () => {
    if (!product || product.image.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + product.image.length) % product.image.length);
  };

  // Swipe handlers (using touch events)
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && product && product.image.length > 1) nextImage();
    if (isRightSwipe && product && product.image.length > 1) prevImage();
  };

  /* ----------------------------- UI States -------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading product…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Button onClick={() => router.push("/store")} className="mt-4">
          Back to Store
        </Button>
      </div>
    );
  }

  const currentImage = product.image && product.image.length > 0
    ? product.image[currentImageIndex]
    : "https://via.placeholder.com/600x600?text=No+Image";

  /* ----------------------------- Render ---------------------------------- */

  const renderStars = () => {
    const rating = product.rating ?? 0;
    // const fullStars = Math.floor(rating);
    const fullStars = 5;
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center /bg-red-500">
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
        {rating > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-10 relative">
      <div className="container grid gap-8 md:grid-cols-2">
        {/* Image Section */}
        <div className="group relative aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center select-none">
          <img
            src={currentImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 pointer-events-auto"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          {/* Navigation Arrows */}
          {product.image.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.preventDefault(); prevImage(); }} 
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm text-white rounded-full hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); nextImage(); }} 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-sm text-white rounded-full hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronRight size={24} />
              </button>

              {/* Dots / Thumbnails Overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {product.image.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all shadow-md",
                      currentImageIndex === idx ? "bg-white scale-110" : "bg-white/50 hover:bg-white/80"
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Admin Image Controls */}
          {isAdmin && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
              {/* Add Image */}
              <Dialog open={isAddImageOpen} onOpenChange={setIsAddImageOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="secondary" className="shadow-lg h-10 w-10 rounded-full bg-white/90 hover:bg-white text-green-600 hover:text-green-700">
                    <Plus size={20} />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Product Image</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddImageOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddImage} disabled={!newImageFile || uploadingImage}>
                      {uploadingImage ? "Uploading..." : "Upload & Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Image */}
              {product.image.length > 0 && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="shadow-lg h-10 w-10 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(currentImageIndex)}
                >
                  <Trash size={18} />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex flex-col">
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          <div className="mt-2 flex items-center gap-2 min-w-20">
            {renderStars()}
            <span className="text-sm text-muted-foreground">
              ({product.rating.toFixed(1)})
            </span>
          </div>

          <p className="mt-4 text-3xl font-bold text-primary">
            {CURRENCY.format(product.price)}
          </p>

          <div className="mt-6 flex-1 relative group/desc">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Description</h3>
              {isAdmin && !isEditingDescription && (
                 <Button
                 size="sm"
                 variant="ghost"
                 className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                 onClick={() => {
                   setNewDescription(product.description);
                   setIsEditingDescription(true);
                 }}
               >
                 <Edit size={14} className="mr-1" /> Edit
               </Button>
              )}
            </div>
            
            {!isEditingDescription ? (
               <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description}
               </div>
            ) : (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border animate-in fade-in zoom-in-95 duration-200">
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="min-h-[150px] bg-background"
                  placeholder="Enter product description..."
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditingDescription(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveDescription}>Save Changes</Button>
                </div>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="mt-6 flex items-center gap-2">
             <div className={`w-2.5 h-2.5 rounded-full ${product.inStock ? "bg-green-500" : "bg-red-500"}`} />
             <p className={`font-medium ${product.inStock ? "text-green-700" : "text-red-600"}`}>
               {product.inStock ? "In Stock" : "Out of Stock"}
             </p>
          </div>
          

          {/* Controls */}
          <div className="mt-8 flex flex-col gap-4">
             <div className="flex items-center gap-4">
               <div className="flex items-center border border-input rounded-md">
                  <Button variant="ghost" size="icon" onClick={handleDecrease} disabled={quantity <= 0} className="h-10 w-10">
                    <Minus size={16} />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={handleIncrease} className="h-10 w-10">
                    <Plus size={16} />
                  </Button>
               </div>
               
               <Button
                  className="flex-1 h-10 text-base shadow-md hover:shadow-lg transition-all"
                  disabled={!product.inStock || isAdding}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isAdding ? "Adding..." : "Add to Cart"}
                </Button>
             </div>
          </div>

        </div>
      </div>

      <Separator className="my-16" />

      <Similar similar={allProducts} />

      <Separator className="my-16" />

      <div className="container pb-20">
        <h2 className="text-2xl font-bold mb-6">More to Explore</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allProducts
            .filter((p) => p.id !== id)
            .slice(0, 8) // Limit to 8 products
            .map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                orientation="vertical"
                onAddToCart={(p) => {
                  addItem(p, 1);
                  toast.success(`${p.name} added to cart`);
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
