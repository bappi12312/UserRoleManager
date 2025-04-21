import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { Product, insertProductSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Loader2, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Star,
  RefreshCcw
} from "lucide-react";

// Extended product schema with validation for forms
const productFormSchema = insertProductSchema.extend({
  price: z.number().positive("Price must be positive"),
  commission: z.number().min(0, "Minimum 0%").max(100, "Maximum 100%"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function AdminProducts() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Form for adding a new product
  const addProductForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      commission: 0,
    },
  });
  
  // Form for editing a product
  const editProductForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      commission: 0,
    },
  });
  
  // Mutations
  const addProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "The product has been successfully added",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAddDialogOpen(false);
      addProductForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Product",
        description: error.message || "There was an error adding the product",
        variant: "destructive",
      });
    }
  });
  
  const editProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ProductFormValues }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Updated",
        description: "The product has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Product",
        description: error.message || "There was an error updating the product",
        variant: "destructive",
      });
    }
  });
  
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setDeleteProductId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Product",
        description: error.message || "There was an error deleting the product",
        variant: "destructive",
      });
    }
  });
  
  // Event handlers
  const onAddProductSubmit = (data: ProductFormValues) => {
    addProductMutation.mutate(data);
  };
  
  const onEditProductSubmit = (data: ProductFormValues) => {
    if (selectedProduct) {
      editProductMutation.mutate({ id: selectedProduct.id, data });
    }
  };
  
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    editProductForm.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      commission: product.commission,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteProduct = (id: number) => {
    deleteProductMutation.mutate(id);
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">Product Management</h1>
          <p className="text-gray-600">Add, edit and remove products from the platform</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative w-full sm:w-1/2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 ml-auto">
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>
                        Fill in the details to add a new product to the marketplace.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...addProductForm}>
                      <form onSubmit={addProductForm.handleSubmit(onAddProductSubmit)} className="space-y-4 py-4">
                        <FormField
                          control={addProductForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter product name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={addProductForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter product description" 
                                  className="resize-none" 
                                  rows={3}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={addProductForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price ($)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addProductForm.control}
                            name="commission"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Commission (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="0"
                                    {...field}
                                    onChange={e => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={addProductForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Image URL</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter image URL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="submit" disabled={addProductMutation.isPending}>
                            {addProductMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : "Add Product"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 mr-3">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-md">
                              {product.description.length > 50 
                                ? `${product.description.substring(0, 50)}...` 
                                : product.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.commission}%</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400 mr-1" />
                          <span>{product.rating.toFixed(1)}</span>
                          <span className="text-gray-400 text-xs ml-1">({product.reviewCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          
                          <AlertDialog open={deleteProductId === product.id} onOpenChange={(open) => {
                            if (!open) setDeleteProductId(null);
                          }}>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => setDeleteProductId(product.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={deleteProductMutation.isPending}
                                >
                                  {deleteProductMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-gray-700">No products found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or add a new product</p>
            </div>
          )}
        </div>
        
        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update the details of this product.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editProductForm}>
              <form onSubmit={editProductForm.handleSubmit(onEditProductSubmit)} className="space-y-4 py-4">
                <FormField
                  control={editProductForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editProductForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product description" 
                          className="resize-none" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editProductForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editProductForm.control}
                    name="commission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="0"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editProductForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter image URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={editProductMutation.isPending}>
                    {editProductMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : "Update Product"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
