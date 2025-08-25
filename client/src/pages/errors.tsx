import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, AlertCircle, DollarSign, TrendingUp, BarChart3, PieChart, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertErrorSchema, type Error, type InsertError } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type DateFilter = 'ytd' | 'mtd' | 'custom' | 'all';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Comparison Indicator Component
function ComparisonIndicator({ current, previous, isMonetary = false }: { current: number; previous: number; isMonetary?: boolean }) {
  const difference = current - previous;
  const percentChange = previous !== 0 ? ((difference / previous) * 100) : 0;
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;

  if (difference === 0) {
    return <span className="text-gray-500 text-xs">No change</span>;
  }

  return (
    <span className={`text-xs flex items-center ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
      {isIncrease ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
      {isMonetary ? `$${Math.abs(difference).toFixed(2)}` : Math.abs(difference)} 
      ({Math.abs(percentChange).toFixed(1)}%)
    </span>
  );
}

export default function ErrorsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<Error | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('ytd');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Calculate date ranges
  const dateRanges = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    const getDateRange = (filter: DateFilter): { current: DateRange; previous: DateRange } => {
      switch (filter) {
        case 'ytd': {
          const currentYtdStart = new Date(currentYear, 0, 1);
          const currentYtdEnd = now;
          const previousYtdStart = new Date(currentYear - 1, 0, 1);
          const previousYtdEnd = new Date(currentYear - 1, currentMonth, currentDate);
          return {
            current: { startDate: currentYtdStart, endDate: currentYtdEnd },
            previous: { startDate: previousYtdStart, endDate: previousYtdEnd }
          };
        }
        case 'mtd': {
          const currentMtdStart = new Date(currentYear, currentMonth, 1);
          const currentMtdEnd = now;
          const previousMtdStart = new Date(currentYear, currentMonth - 1, 1);
          const previousMtdEnd = new Date(currentYear, currentMonth - 1, currentDate);
          return {
            current: { startDate: currentMtdStart, endDate: currentMtdEnd },
            previous: { startDate: previousMtdStart, endDate: previousMtdEnd }
          };
        }
        case 'custom': {
          if (!customStartDate || !customEndDate) {
            return {
              current: { startDate: new Date(currentYear, 0, 1), endDate: now },
              previous: { startDate: new Date(currentYear - 1, 0, 1), endDate: new Date(currentYear - 1, 11, 31) }
            };
          }
          const customStart = new Date(customStartDate);
          const customEnd = new Date(customEndDate);
          const daysDiff = Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24));
          const previousStart = new Date(customStart.getTime() - (daysDiff * 24 * 60 * 60 * 1000));
          const previousEnd = new Date(customStart.getTime() - (1 * 24 * 60 * 60 * 1000));
          return {
            current: { startDate: customStart, endDate: customEnd },
            previous: { startDate: previousStart, endDate: previousEnd }
          };
        }
        default:
          return {
            current: { startDate: new Date(2020, 0, 1), endDate: now },
            previous: { startDate: new Date(2020, 0, 1), endDate: now }
          };
      }
    };

    return getDateRange(dateFilter);
  }, [dateFilter, customStartDate, customEndDate]);

  // Fetch current period errors
  const { data: currentErrors = [], isLoading: currentErrorsLoading } = useQuery<Error[]>({
    queryKey: ["/api/errors/by-date-range", dateRanges.current.startDate.toISOString(), dateRanges.current.endDate.toISOString()],
    enabled: dateFilter !== 'all'
  });

  // Fetch previous period errors for comparison
  const { data: previousErrors = [], isLoading: previousErrorsLoading } = useQuery<Error[]>({
    queryKey: ["/api/errors/by-date-range", dateRanges.previous.startDate.toISOString(), dateRanges.previous.endDate.toISOString()],
    enabled: dateFilter !== 'all'
  });

  // Fetch all errors when no filter
  const { data: allErrors = [], isLoading: allErrorsLoading } = useQuery<Error[]>({
    queryKey: ["/api/errors"],
    enabled: dateFilter === 'all'
  });

  // Use appropriate error set based on filter
  const errors = dateFilter === 'all' ? allErrors : currentErrors;
  const errorsLoading = dateFilter === 'all' ? allErrorsLoading : currentErrorsLoading;

  // Calculate statistics for current and previous periods
  const statistics = useMemo(() => {
    if (dateFilter === 'all') {
      const totalErrors = allErrors.length;
      const resolvedErrors = allErrors.filter(e => e.isResolved).length;
      const unresolvedErrors = totalErrors - resolvedErrors;
      const costToLsd = allErrors.reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0);
      
      const errorsByType: { [key: string]: number } = {};
      const errorsByResponsibleParty: { [key: string]: number } = {};
      
      allErrors.forEach(error => {
        errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
        errorsByResponsibleParty[error.responsibleParty] = (errorsByResponsibleParty[error.responsibleParty] || 0) + 1;
      });
      
      return {
        totalErrors,
        resolvedErrors,
        unresolvedErrors,
        costToLsd,
        errorsByType,
        errorsByResponsibleParty
      };
    }

    // Calculate current period stats
    const currentTotalErrors = currentErrors.length;
    const currentResolvedErrors = currentErrors.filter(e => e.isResolved).length;
    const currentUnresolvedErrors = currentTotalErrors - currentResolvedErrors;
    const currentCostToLsd = currentErrors.reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0);
    
    const currentErrorsByType: { [key: string]: number } = {};
    const currentErrorsByResponsibleParty: { [key: string]: number } = {};
    
    currentErrors.forEach(error => {
      currentErrorsByType[error.errorType] = (currentErrorsByType[error.errorType] || 0) + 1;
      currentErrorsByResponsibleParty[error.responsibleParty] = (currentErrorsByResponsibleParty[error.responsibleParty] || 0) + 1;
    });

    // Calculate previous period stats
    const previousTotalErrors = previousErrors.length;
    const previousResolvedErrors = previousErrors.filter(e => e.isResolved).length;
    const previousUnresolvedErrors = previousTotalErrors - previousResolvedErrors;
    const previousCostToLsd = previousErrors.reduce((sum, e) => sum + parseFloat(e.costToLsd || '0'), 0);
    
    return {
      totalErrors: currentTotalErrors,
      resolvedErrors: currentResolvedErrors,
      unresolvedErrors: currentUnresolvedErrors,
      costToLsd: currentCostToLsd,
      errorsByType: currentErrorsByType,
      errorsByResponsibleParty: currentErrorsByResponsibleParty,
      comparison: {
        totalErrors: previousTotalErrors,
        resolvedErrors: previousResolvedErrors,
        unresolvedErrors: previousUnresolvedErrors,
        costToLsd: previousCostToLsd
      }
    };
  }, [currentErrors, previousErrors, allErrors, dateFilter]);

  const statsLoading = dateFilter === 'all' ? allErrorsLoading : (currentErrorsLoading || previousErrorsLoading);

  // Create error mutation
  const createErrorMutation = useMutation({
    mutationFn: async (data: InsertError) => {
      return await apiRequest("/api/errors", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/errors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/errors/by-date-range"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/errors/by-date-range"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/errors/by-date-range"] });
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

  // Helper functions for charts
  const formatErrorType = (type: string) => {
    const types: { [key: string]: string } = {
      pricing: 'Pricing',
      in_hands_date: 'In-hands Date',
      shipping: 'Shipping',
      printing: 'Printing',
      artwork_proofing: 'Artwork/Proofing',
      oos: 'Out of Stock',
      other: 'Other'
    };
    return types[type] || type;
  };

  const formatResponsibleParty = (party: string) => {
    const parties: { [key: string]: string } = {
      customer: 'Customer',
      vendor: 'Vendor',
      lsd: 'LSD'
    };
    return parties[party] || party;
  };

  const getErrorTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      pricing: '#ef4444',
      in_hands_date: '#f59e0b',
      shipping: '#3b82f6',
      printing: '#8b5cf6',
      artwork_proofing: '#10b981',
      oos: '#f97316',
      other: '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const getCostByErrorType = (errors: Error[]) => {
    const costsByType: { [key: string]: number } = {};
    
    errors.forEach(error => {
      const cost = parseFloat(error.costToLsd || '0');
      const type = formatErrorType(error.errorType);
      costsByType[type] = (costsByType[type] || 0) + cost;
    });
    
    return Object.entries(costsByType).map(([errorType, cost]) => ({
      errorType,
      cost: Number(cost.toFixed(2))
    }));
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading error data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Tracking</h1>
          <p className="text-gray-600">Manage and track errors across your orders and projects</p>
        </div>
        <div className="flex space-x-4">
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
      </div>

      {/* Date Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Date Range & Comparison
          </CardTitle>
          <CardDescription>Filter errors by date period and compare with previous periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ytd">Year to Date (YTD)</SelectItem>
                <SelectItem value="mtd">Month to Date (MTD)</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-[150px]"
                  placeholder="Start date"
                />
                <span className="text-sm text-gray-500">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-[150px]"
                  placeholder="End date"
                />
              </div>
            )}
            
            {dateFilter !== 'all' && (
              <div className="text-sm text-gray-600">
                <div>Current: {dateRanges.current.startDate.toLocaleDateString()} - {dateRanges.current.endDate.toLocaleDateString()}</div>
                <div>Comparison: {dateRanges.previous.startDate.toLocaleDateString()} - {dateRanges.previous.endDate.toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              {dateFilter !== 'all' && statistics.comparison && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <ComparisonIndicator current={statistics.totalErrors} previous={statistics.comparison.totalErrors} />
                  <span className="ml-1">vs previous period ({statistics.comparison.totalErrors})</span>
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.resolvedErrors}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  {statistics.totalErrors > 0 
                    ? `${Math.round((statistics.resolvedErrors / statistics.totalErrors) * 100)}% resolution rate`
                    : "No errors yet"
                  }
                </div>
                {dateFilter !== 'all' && statistics.comparison && (
                  <div className="flex items-center">
                    <ComparisonIndicator current={statistics.resolvedErrors} previous={statistics.comparison.resolvedErrors} />
                    <span className="ml-1">vs previous ({statistics.comparison.resolvedErrors})</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.unresolvedErrors}</div>
              {dateFilter !== 'all' && statistics.comparison && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <ComparisonIndicator current={statistics.unresolvedErrors} previous={statistics.comparison.unresolvedErrors} />
                  <span className="ml-1">vs previous ({statistics.comparison.unresolvedErrors})</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost to LSD</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics.costToLsd.toFixed(2)}</div>
              {dateFilter !== 'all' && statistics.comparison && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <ComparisonIndicator current={statistics.costToLsd} previous={statistics.comparison.costToLsd} isMonetary />
                  <span className="ml-1">vs previous (${statistics.comparison.costToLsd.toFixed(2)})</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {statistics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Error Types Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Error Types Distribution
              </CardTitle>
              <CardDescription>Breakdown of errors by type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Tooltip formatter={(value, name) => [value, formatErrorType(name as string)]} />
                    <Pie
                      data={Object.entries(statistics.errorsByType).map(([key, value]) => ({
                        name: key,
                        value,
                        label: formatErrorType(key)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label, percent }: { label: string; percent: number }) => `${label} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(statistics.errorsByType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getErrorTypeColor(entry[0])} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Responsible Party Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Responsibility Analysis
              </CardTitle>
              <CardDescription>Who is responsible for errors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(statistics.errorsByResponsibleParty).map(([key, value]) => ({
                    name: formatResponsibleParty(key),
                    errors: value
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="errors" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cost Analysis */}
      {statistics && errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5" />
              Cost Analysis by Error Type
            </CardTitle>
            <CardDescription>Financial impact of different error types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getCostByErrorType(errors)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="errorType" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Cost to LSD']} />
                  <Bar dataKey="cost" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
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