import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  DollarSign, 
  Palette, 
  Ruler, 
  TrendingUp,
  ShoppingCart,
  Building2,
  Calendar,
  ExternalLink,
  Box
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    supplierId?: string;
    basePrice?: number;
    minimumQuantity?: number;
    colors?: string[];
    sizes?: string[];
    imprintMethods?: string[];
    leadTime?: number;
    imageUrl?: string;
  } | null;
  supplierName?: string;
}

export function ProductDetailModal({ open, onOpenChange, product, supplierName }: ProductDetailModalProps) {
  const [, setLocation] = useLocation();

  // Fetch orders that include this product
  const { data: ordersWithProduct = [] } = useQuery<any[]>({
    queryKey: ["/api/products", product?.id, "orders"],
    enabled: !!product?.id && open,
    queryFn: async () => {
      // In a real implementation, this would fetch orders containing this product
      // For now, we'll return empty array
      return [];
    },
  });

  if (!product) return null;

  const handleCreateQuote = () => {
    setLocation(`/orders?product=${product.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="w-6 h-6" />
            {product.name}
            {product.sku && (
              <Badge variant="outline" className="font-mono">
                {product.sku}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          {product.imageUrl ? (
            <Card>
              <CardContent className="p-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 flex items-center justify-center h-64 bg-gray-50">
                <Box className="w-16 h-16 text-gray-300" />
              </CardContent>
            </Card>
          )}

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{product.description}</p>
                </div>
              )}

              {supplierName && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Supplier:</span>
                  <span className="text-sm">{supplierName}</span>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                {product.basePrice && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Base Price:</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-base">
                      ${product.basePrice}
                    </Badge>
                  </div>
                )}

                {product.minimumQuantity && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Min Quantity:</span>
                    <span className="text-sm">{product.minimumQuantity} pcs</span>
                  </div>
                )}

                {product.leadTime && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Lead Time:</span>
                    </div>
                    <span className="text-sm">{product.leadTime} days</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="w-5 h-5" />
                  Available Colors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {color}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="w-5 h-5" />
                  Available Sizes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {size}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Imprint Methods */}
          {product.imprintMethods && product.imprintMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5" />
                  Imprint Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.imprintMethods.map((method, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {method}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders Using This Product */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersWithProduct.length > 0 ? (
                <div className="space-y-2">
                  {ordersWithProduct.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                      <div>
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.companyName}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setLocation(`/orders?id=${order.id}`);
                          onOpenChange(false);
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No orders yet using this product</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={handleCreateQuote}
                  >
                    Create First Quote
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={handleCreateQuote}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Create Quote with This Product
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
