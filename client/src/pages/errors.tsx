import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, AlertCircle, DollarSign, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertErrorSchema, type Error, type InsertError } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ErrorsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch errors
  const { data: errors = [], isLoading: errorsLoading } = useQuery<Error[]>({
    queryKey: ["/api/errors"],
  });

  // Fetch error statistics
  const { data: statistics, isLoading: statsLoading } = useQuery<{
    totalErrors: number;
    resolvedErrors: number;
    unresolvedErrors: number;
    costToLsd: number;
    errorsByType: { [key: string]: number };
    errorsByResponsibleParty: { [key: string]: number };
  }>({
    queryKey: ["/api/errors/statistics"],
  });

  // Create error mutation
  const createErrorMutation = useMutation({
    mutationFn: async (data: InsertError) => {
      return await apiRequest("/api/errors", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/errors/statistics"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Error Created",
        description: "Error has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create error.",
        variant: "destructive",
      });
    },
  });

  // Update error mutation
  const updateErrorMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<InsertError> }) => {
      return await apiRequest(`/api/errors/${data.id}`, "PUT", data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/errors/statistics"] });
      setSelectedError(null);
      toast({
        title: "Error Updated",
        description: "Error has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update error.",
        variant: "destructive",
      });
    },
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      return await apiRequest(`/api/errors/${errorId}/resolve`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/errors/statistics"] });
      toast({
        title: "Error Resolved",
        description: "Error has been marked as resolved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to resolve error.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertError>({
    resolver: zodResolver(insertErrorSchema.omit({ createdBy: true })),
    defaultValues: {
      errorType: "other",
      responsibleParty: "lsd",
      resolution: "other",
      costToLsd: "0",
      isResolved: false,
    },
  });

  const onSubmit = (data: InsertError) => {
    if (selectedError) {
      updateErrorMutation.mutate({ id: selectedError.id, updates: data });
    } else {
      createErrorMutation.mutate(data);
    }
  };

  const getErrorTypeBadge = (type: string) => {
    const colors = {
      pricing: "bg-red-100 text-red-800",
      in_hands_date: "bg-yellow-100 text-yellow-800",
      shipping: "bg-blue-100 text-blue-800",
      printing: "bg-purple-100 text-purple-800",
      artwork_proofing: "bg-green-100 text-green-800",
      oos: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getResponsiblePartyBadge = (party: string) => {
    const colors = {
      customer: "bg-blue-100 text-blue-800",
      vendor: "bg-yellow-100 text-yellow-800",
      lsd: "bg-red-100 text-red-800",
    };
    return colors[party as keyof typeof colors] || colors.lsd;
  };

  if (errorsLoading || statsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Tracking</h1>
          <p className="text-gray-600">Manage and track errors across your orders and projects</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Report Error
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedError ? "Edit Error" : "Report New Error"}</DialogTitle>
            </DialogHeader>
            <ErrorForm
              form={form}
              onSubmit={onSubmit}
              isLoading={createErrorMutation.isPending || updateErrorMutation.isPending}
              selectedError={selectedError}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalErrors}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.resolvedErrors}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.totalErrors > 0 
                  ? `${Math.round((statistics.resolvedErrors / statistics.totalErrors) * 100)}% resolution rate`
                  : "No errors yet"
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.unresolvedErrors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost to LSD</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics.costToLsd.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Errors List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>Track and manage all reported errors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>No errors reported yet</p>
              </div>
            ) : (
              errors.map((error: Error) => (
                <div 
                  key={error.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedError(error);
                    form.reset({
                      ...error,
                      date: error.date,
                    });
                    setIsCreateModalOpen(true);
                  }}
                  data-testid={`error-row-${error.id}`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getErrorTypeBadge(error.errorType)}>
                        {error.errorType.replace('_', ' ')}
                      </Badge>
                      <Badge className={getResponsiblePartyBadge(error.responsibleParty)}>
                        {error.responsibleParty}
                      </Badge>
                      {error.isResolved ? (
                        <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Open</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Client:</span> {error.clientName}
                      </div>
                      <div>
                        <span className="font-medium">Project:</span> {error.projectNumber || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(error.date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span> ${parseFloat(error.costToLsd || '0').toFixed(2)}
                      </div>
                    </div>
                    
                    {error.additionalNotes && (
                      <p className="text-sm text-gray-600 line-clamp-2">{error.additionalNotes}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {!error.isResolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveErrorMutation.mutate(error.id);
                        }}
                        disabled={resolveErrorMutation.isPending}
                        data-testid={`resolve-error-${error.id}`}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error Form Component
function ErrorForm({ 
  form, 
  onSubmit, 
  isLoading, 
  selectedError 
}: { 
  form: any; 
  onSubmit: (data: InsertError) => void; 
  isLoading: boolean;
  selectedError: Error | null;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    value={field.value ? (typeof field.value === 'string' ? field.value.split('T')[0] : new Date(field.value).toISOString().split('T')[0]) : ''} 
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    data-testid="input-error-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Number</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-project-number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="errorType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Error Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-error-type">
                      <SelectValue placeholder="Select error type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pricing">Pricing</SelectItem>
                    <SelectItem value="in_hands_date">In-hands Date</SelectItem>
                    <SelectItem value="shipping">Shipping</SelectItem>
                    <SelectItem value="printing">Printing</SelectItem>
                    <SelectItem value="artwork_proofing">Artwork/Proofing</SelectItem>
                    <SelectItem value="oos">Out of Stock</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsibleParty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsible Party</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-responsible-party">
                      <SelectValue placeholder="Select responsible party" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="lsd">LSD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-client-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vendorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-vendor-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="resolution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resolution</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-resolution">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="credit_for_future_order">Credit for Future Order</SelectItem>
                  <SelectItem value="reprint">Reprint</SelectItem>
                  <SelectItem value="courier_shipping">Courier/Shipping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="costToLsd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost to LSD</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    data-testid="input-cost-to-lsd"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productionRep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Production Rep</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-production-rep" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orderRep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Rep</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-order-rep" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clientRep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Rep</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-client-rep" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  className="min-h-[100px]" 
                  {...field} 
                  data-testid="textarea-additional-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading} data-testid="button-save-error">
            {isLoading ? "Saving..." : selectedError ? "Update Error" : "Create Error"}
          </Button>
        </div>
      </form>
    </Form>
  );
}