// components/BookForm.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// interface Product {
//   id: string;
//   //ministryId: string;
//   title: string;
//   author?: string;
//   @id @default(auto()) @map("_id") @db.ObjectId
//   name     String
//   description String?
//   category     Category     @relation(fields: [categoryId], references: [id])
//   categoryId    String    @db.ObjectId
//   price    Float
//   stock: any;
//   reviews  Review[]
//   cartItems: any;
//   Featured : any;
//   images: any;
//   createdAt?: Date;
//   updatedAt?: Date; 
// }

export default function ProductForm({ initialProduct, hideList = false }: { initialProduct?: any, hideList?: boolean }) {
  const [products, setProducts] = useState<any>([]);
  const [formData, setFormData] = useState<any>({ //useState<Omit<any, 'id' | 'createdAt' | 'updatedAt'>>({
    name: initialProduct?.name || '',
    description: initialProduct?.description || '',
    categoryId: initialProduct?.categoryId || '',
    price: initialProduct?.price || 0,
    costPrice: initialProduct?.costPrice || 0,
    images: initialProduct?.images || null,
  });
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);//categories to be mapped to the select input
  const [preview, setPreview] = useState(null);
  const [uploadStatus , setUploadStatus] = useState("");

  const [productImage, setProductImage] = useState(null);
  const [editId, setEditId] = useState<string | null>(initialProduct?.id || null);

  useEffect(() => {
    if (!hideList) fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        name: initialProduct.name || '',
        description: initialProduct.description || '',
        categoryId: initialProduct.categoryId || initialProduct.category?.id || '',
        price: initialProduct.price || 0,
        costPrice: initialProduct.costPrice || 0,
        images: initialProduct.images || null,
      });
      setEditId(initialProduct.id);
    }
  }, [initialProduct]);


  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/dbhandler?model=product');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const fetchCategories = async () => {
    const res = await axios.get('/api/dbhandler?model=category');
    setCategories(res.data);
    if (res.data.length > 0) {
      setFormData(prev => ({
        ...prev,
        categoryId: res.data[0].id,
        category: res.data[0].name
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      category: categories.length > 0 ? categories[0].name : '',
      price: 0,
      costPrice: 0,
      images: null,
    });
    setEditId(null);
    setFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload: any = {
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId,
      price: parseFloat(String(formData.price)) || 0,
    };

    if (formData.costPrice !== undefined && formData.costPrice !== null && formData.costPrice !== "") {
      payload.costPrice = parseFloat(String(formData.costPrice)) || 0;
    }

    try {
      if (editId) {
        if (file) {
          const pformData = new FormData();
          pformData.append("file", file);
          Object.entries(payload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              pformData.append(key, String(value));
            }
          });
          await axios.put(`/api/dbhandler?model=product&id=${editId}`, pformData);
        } else {
          await axios.put(`/api/dbhandler?model=product&id=${editId}`, payload);
        }
      } else {
        const pformData = new FormData();
        if (file) {
          pformData.append("file", file);
        }
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            pformData.append(key, String(value));
          }
        });
        await axios.post(`/api/product`, pformData);
      }

      setUploadStatus("Product saved successfully");
      toast.success(editId ? "Product updated successfully" : "Product created successfully");
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save product.");
    }
  };


  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile.size > 300 * 1024){
      toast.warning("File size greater than 300kb. Upload might fail.");
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  const handleDelete = async (product : any) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return;
    try {
      const res = await axios.delete(`/api/dbhandler?model=product&id=${product.id}`);
      if (res.status === 200  || res.status === 201) {
        toast.success('Product deleted successfully.');
      }
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product.');
    }
  };

  const handleEdit = (product: any) => {
    setEditId(product.id);
    setFile(null);        // 🔑 important
    setPreview(null);     // 🔑 important

    setFormData({
      name: product.name ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId ?? product.category?.id ?? '',
      price: product.price ?? 0,
      costPrice: product.costPrice ?? 0,
      images: product.images ?? [],
    });
  };

  

  return (
    <div>
      
      <form onSubmit={handleSubmit} className='flex flex-col w-full max-w-sm gap-2 justify-center items-center p-3 border-2 border-secondary-foreground rounded-sm m-2'>
        <h2>Product Form</h2>

        <div className="w-full space-y-1">
          <Label htmlFor="product-name">Product Name</Label>
          <Input
            id="product-name"
            placeholder="Name of product"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="product-desc">Product Description</Label>
          <Input
            id="product-desc"
            placeholder="Description of product"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="w-full space-y-1 text-center flex flex-col items-center">
          <Label htmlFor="product-category" className='mb-2'>Product Category</Label>
          <Select 
            value={formData.categoryId} 
            onValueChange={(value) => {
              const selectedCategory = categories.find(cat => cat.id === value);
              setFormData({ 
                ...formData, 
                categoryId: value, 
                category: selectedCategory ? selectedCategory.name : ''
              });
            }}
          >
            <SelectTrigger id="product-category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 ? categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              )) : <SelectItem value="none" disabled>No categories</SelectItem>}
            </SelectContent>
          </Select>
        </div>


        <div className="w-full space-y-1">
          <Label htmlFor="product-price">Product Price</Label>
          <Input
            id="product-price"
            placeholder="Price of product"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            type="number"
          />
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="product-cost-price">Product Cost Price</Label>
          <Input
            id="product-cost-price"
            placeholder="Cost price of product"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            type="number"
          />
        </div>

        <div className="w-full space-y-1">
          <Label htmlFor="product-image">Product Image</Label>
        {!preview && formData?.images?.length > 0 && (
          <img
            src={formData.images[0]}
            alt="Current product"
            style={{ maxHeight: '300px', marginTop: '1rem' }}
          />
        )}
        {(preview) && (        //{(preview || formData?.images[0]!=null) && (
              <div style={{ marginTop: '1rem' }}>
                <img src={preview} alt="Selected preview" style={{ maxHeight: '300px' }} />
              </div>
            )}
            <Input
              type="file"
              name='image'
              id='product-image'
              placeholder="Product image"
              onChange={handleImageChange}
            />
        </div>
        <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
        {editId && <Button type="button" onClick={resetForm}>Cancel</Button>}


        {!hideList && (
          <ul className='w-full'>
            {products.length > 0 ? (
              products.map((item, index) => (
                <li key={index} className="flex flex-col justify-center items-center gap-2 my-2 bg-secondary rounded-md w-full p-2">
                  <div className="flex flex-row gap-2">
                    <span>{(index + 1)}. Name : </span>
                    <span>{item.name}</span>
                  </div>
                  <p>Price : {item.price || <em>No price tag</em>}</p>
                  <div className='flex flex-row gap-2 p-1 w-full'>
                    <Button type='button' onClick={() => handleEdit(item)} className='flex-1'>Edit</Button>
                    <Button type='button' onClick={() => handleDelete(item)} variant='ghost' className='flex-1 border-2 border-accent'>Delete</Button>
                  </div>
                </li>
              ))
            ) : (
              <p>No available product.</p>
            )}
          </ul>
        )}
      </form>
    </div>
  );
}