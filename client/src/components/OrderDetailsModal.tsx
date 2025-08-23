import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  Package, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Clock,
  FileText,
  Truck,
  CheckCircle
} from "lucide-react";
import type { Order } from "@shared/schema";

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  companyName: string;
}

const statusColorMap = {
  quote: "bg-blue-100 text-blue-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  in_production: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusDisplayMap = {
  quote: "Quote",
  pending_approval: "Pending Approval",
  approved: "Approved",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderDetailsModal({ open, onOpenChange, order, companyName }: OrderDetailsModalProps) {
  if (!order) return null;

  const statusClass = statusColorMap[order.status as keyof typeof statusColorMap] || "bg-gray-100 text-gray-800";
  const statusLabel = statusDisplayMap[order.status as keyof typeof statusDisplayMap] || order.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            Order #{order.orderNumber}
            <Badge className={statusClass}>
              {statusLabel}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete order details and information
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Order Information */}
          <div className="space-y-6">
            {/* Company & Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar name={companyName} size="sm" />
                  <div>
                    <p className="font-semibold">{companyName}</p>
                    <p className="text-sm text-gray-600">Primary Client</p>
                  </div>
                </div>
                
                {order.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{order.contactName}</span>
                  </div>
                )}
                
                {order.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{order.contactEmail}</span>
                  </div>
                )}
                
                {order.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{order.contactPhone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Type</p>
                    <Badge variant="outline" className="mt-1">
                      {order.orderType?.replace('_', ' ').toUpperCase() || 'QUOTE'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    <Badge variant={order.priority === 'high' ? 'destructive' : order.priority === 'medium' ? 'default' : 'secondary'} className="mt-1">
                      {order.priority?.toUpperCase() || 'NORMAL'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Total: </span>
                    <span className="text-lg font-bold text-green-600">
                      ${Number(order.total || 0).toLocaleString()}
                    </span>
                  </div>

                  {order.depositAmount && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Deposit: </span>
                      <span className="text-sm">
                        ${Number(order.depositAmount).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {order.inHandsDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">In-Hands Date: </span>
                      <span className="text-sm">
                        {new Date(order.inHandsDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {order.eventDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Event Date: </span>
                      <span className="text-sm">
                        {new Date(order.eventDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Additional Information */}
          <div className="space-y-6">
            {/* Shipping Information */}
            {(order.shippingAddress || order.shippingMethod) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.shippingAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Shipping Address:</p>
                        <p className="text-gray-600 whitespace-pre-line">{order.shippingAddress}</p>
                      </div>
                    </div>
                  )}
                  
                  {order.shippingMethod && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Shipping Method</p>
                      <p className="text-sm">{order.shippingMethod}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes & Special Instructions */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notes & Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="text-sm">
                    <p className="font-medium">Order Created</p>
                    <p className="text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-sm">
                      <p className="font-medium">Last Updated</p>
                      <p className="text-gray-500">
                        {new Date(order.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="default" className="flex-1">
                Edit Order
              </Button>
              <Button variant="outline" className="flex-1">
                View Project
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}