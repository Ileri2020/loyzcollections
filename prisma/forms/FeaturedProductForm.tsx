import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price?: number;
  description?: string;
  images?: string[];
}

interface FeaturedProduct {
  id: string;
  productId: string;
  product: Product;
}

const MAX_FEATURED_PRODUCTS = 16;

interface FeaturedProductFormProps {
  hideList?: boolean;
}

export default function FeaturedProductForm({ hideList = false }: FeaturedProductFormProps) {
  const [featuredProduct, setFeaturedProduct] = useState<FeaturedProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
  });

  const [editId, setEditId] = useState<string | null>(null);

  /* ===============================
     Fetching
  ================================ */
  useEffect(() => {
    refreshAll();
  }, []);

  const refreshAll = async () => {
    await Promise.all([fetchFeaturedProduct(), fetchProducts()]);
  };

  const fetchFeaturedProduct = async () => {
    try {
      const res = await axios.get("/api/dbhandler?model=featuredProduct");
      setFeaturedProduct(res.data);
    } catch (err) {
      console.error("Failed to fetch featured products", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/dbhandler?model=product");
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  /* ===============================
     Derived State
  ================================ */
  const featuredIds = useMemo(
    () => new Set(featuredProduct.map((f) => f.productId)),
    [featuredProduct]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const isLimitReached =
    featuredProduct.length >= MAX_FEATURED_PRODUCTS && !editId;

  /* ===============================
     Actions
  ================================ */

  // 🔥 OPTION 1: Direct POST when "Feature" is clicked
  const handleFeatureClick = async (item: Product) => {
    if (featuredIds.has(item.id)) return;

    if (featuredProduct.length >= MAX_FEATURED_PRODUCTS) {
      alert(`You can only feature up to ${MAX_FEATURED_PRODUCTS} products.`);
      return;
    }

    try {
      await axios.post("/api/dbhandler?model=featuredProduct", {
        productId: item.id,
      });

      toast.success(`${item.name} featured successfully`);
      await refreshAll();
    } catch (err) {
      console.error("Failed to feature product:", err);
      toast.error("Failed to feature product");
    }
  };

  // Used only for EDIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editId || !formData.productId) return;

    try {
      await axios.put(
        `/api/dbhandler?model=featuredProduct&id=${editId}`,
        { productId: formData.productId }
      );

      toast.success("Featured product updated");
      resetForm();
      refreshAll();
    } catch (err) {
      console.error("Failed to update featured product:", err);
      toast.error("Failed to update featured product");
    }
  };

  const handleEdit = (item: FeaturedProduct) => {
    setFormData({
      productId: item.productId,
      productName: item.product?.name || "",
    });
    setEditId(item.id);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/dbhandler?model=featuredProduct&id=${id}`);
      toast.success("Feature removed");
      refreshAll();
    } catch (err) {
      console.error("Failed to delete featured product", err);
      toast.error("Failed to remove feature");
    }
  };

  const resetForm = () => {
    setFormData({ productId: "", productName: "" });
    setEditId(null);
  };

  /* ===============================
     Render
  ================================ */
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">
        Manage Home Page Featured Products
      </h2>

      {/* ===============================
          FORM (EDIT ONLY)
      ================================ */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-md gap-2 p-3 border-2 border-secondary-foreground rounded-md"
      >
        <div className="w-full space-y-1">
          <Label htmlFor="fp-search">Search Products ({featuredProduct.length}/{MAX_FEATURED_PRODUCTS})</Label>
          <Input
            id="fp-search"
            placeholder="Type to find a product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Product List */}
        <div className="w-full mt-2">
          <Label className="text-sm font-medium">Select Product to Feature</Label>
          <div className="mt-1 max-h-[320px] overflow-y-auto rounded-md border bg-background/50 p-2">
            {filteredProducts.map((item) => {
              const isFeatured = featuredIds.has(item.id);
              const imageUrl = item.images?.[0] || "/placeholder.png";

              return (
                <div
                  key={item.id}
                  className="mb-2 flex items-start gap-3 rounded-md border bg-secondary/40 p-2 transition-colors hover:bg-secondary"
                >
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium leading-tight">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ₦{item.price ?? 0}
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="h-7 w-full text-xs"
                      onClick={() => handleFeatureClick(item)}
                      disabled={isFeatured || isLimitReached}
                      variant={isFeatured ? "outline" : "default"}
                    >
                      {isFeatured
                        ? "Featured"
                        : isLimitReached
                        ? "Limit Reached"
                        : "Add Feature"}
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No products found
              </p>
            )}
          </div>
        </div>

        {editId && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm">Editing Feature</Label>
            <Input value={formData.productName} disabled />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Update</Button>
              <Button type="button" onClick={resetForm} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* ===============================
          FEATURED LIST
      ================================ */}
      {!hideList && (
        <>
          <h3 className="mt-6 font-semibold flex items-center gap-2">
            Current Featured Products
            <span className="text-xs font-normal text-muted-foreground">({featuredProduct.length})</span>
          </h3>

          <ul className="mt-2">
            {featuredProduct.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 mb-3 bg-secondary rounded-md p-3 border shadow-sm"
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">
                    {index + 1}. {item.product?.name ?? "Unnamed Product"}
                  </span>
                  <span className="text-sm font-semibold">
                    ₦{item.product?.price ?? 0}
                  </span>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button type="button" size="sm" onClick={() => handleEdit(item)} className="flex-1">
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
            {featuredProduct.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6 border-2 border-dashed rounded-md">
                No products are currently featured on the homepage.
              </p>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
