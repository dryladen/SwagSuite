import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MoreHorizontal, Search, Filter, Calendar, User, Building, Package, Paperclip, MessageSquare, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const createCardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  companyId: z.string().optional(),
  orderId: z.string().optional(),
  assignedUserId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().optional(),
});

const createColumnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
  color: z.string().default("#6B7280"),
});

type CreateCardFormData = z.infer<typeof createCardSchema>;
type CreateColumnFormData = z.infer<typeof createColumnSchema>;

export default function ArtworkPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewCardDialog, setShowNewCardDialog] = useState(false);
  const [showNewColumnDialog, setShowNewColumnDialog] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState("");
  const queryClient = useQueryClient();

  const cardForm = useForm<CreateCardFormData>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const columnForm = useForm<CreateColumnFormData>({
    resolver: zodResolver(createColumnSchema),
    defaultValues: {
      name: "",
      color: "#6B7280",
    },
  });

  // Fetch data
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ["/api/artwork/columns"],
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/artwork/cards"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Initialize columns if empty
  const initializeColumnsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/artwork/columns/initialize", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artwork/columns"] });
    },
  });

  // Create column mutation
  const createColumnMutation = useMutation({
    mutationFn: async (columnData: CreateColumnFormData) => {
      return apiRequest("/api/artwork/columns", {
        method: "POST",
        body: JSON.stringify({
          ...columnData,
          position: columns.length + 1,
          isDefault: false,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artwork/columns"] });
      setShowNewColumnDialog(false);
      columnForm.reset();
    },
  });

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (cardData: CreateCardFormData) => {
      return apiRequest("/api/artwork/cards", {
        method: "POST",
        body: JSON.stringify({
          ...cardData,
          columnId: selectedColumnId,
          position: cards.filter(card => card.columnId === selectedColumnId).length + 1,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artwork/cards"] });
      setShowNewCardDialog(false);
      cardForm.reset();
    },
  });

  const handleCreateCard = (columnId: string) => {
    setSelectedColumnId(columnId);
    setShowNewCardDialog(true);
  };

  const onCreateCard = (data: CreateCardFormData) => {
    createCardMutation.mutate(data);
  };

  const onCreateColumn = (data: CreateColumnFormData) => {
    createColumnMutation.mutate(data);
  };

  // Initialize columns if empty
  if (columns.length === 0 && !columnsLoading) {
    initializeColumnsMutation.mutate();
  }

  if (columnsLoading || cardsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="w-80 h-96 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Artwork Management</h1>
          <p className="text-gray-600 mt-1">Kanban-style workflow for artwork projects</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search artwork cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog open={showNewColumnDialog} onOpenChange={setShowNewColumnDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Column</DialogTitle>
                <DialogDescription>
                  Add a new column to your artwork board
                </DialogDescription>
              </DialogHeader>
              <Form {...columnForm}>
                <form onSubmit={columnForm.handleSubmit(onCreateColumn)} className="space-y-4">
                  <FormField
                    control={columnForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Column Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter column name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={columnForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowNewColumnDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createColumnMutation.isPending}>
                      Create Column
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {columns.map((column: any) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 bg-white rounded-lg p-3 shadow-sm border">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                ></div>
                <h3 className="font-semibold text-gray-900 text-sm">{column.name}</h3>
                <Badge variant="secondary" className="ml-2 text-xs">
                  {cards.filter(card => card.columnId === column.id).length}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleCreateCard(column.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </DropdownMenuItem>
                  <DropdownMenuItem>Edit Column</DropdownMenuItem>
                  {!column.isDefault && (
                    <DropdownMenuItem className="text-red-600">Delete Column</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Cards Container */}
            <div className="space-y-3 min-h-[400px] bg-gray-50/50 rounded-lg p-3 border-2 border-dashed border-gray-200">
              {cards
                .filter((card: any) => 
                  card.columnId === column.id &&
                  card.title?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((card: any) => (
                  <Card key={card.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-gray-300">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium text-gray-900 leading-tight">
                          {card.title}
                        </CardTitle>
                        {card.priority && (
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(card.priority)} flex-shrink-0 mt-1`}></div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {card.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{card.description}</p>
                      )}
                      
                      {/* Tags Row */}
                      <div className="flex flex-wrap gap-1">
                        {card.companyName && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                            <Building className="w-3 h-3 mr-1" />
                            {card.companyName}
                          </Badge>
                        )}
                        {card.orderNumber && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border-green-200">
                            <Package className="w-3 h-3 mr-1" />
                            #{card.orderNumber}
                          </Badge>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          {card.dueDate && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(card.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {card.attachments && JSON.parse(card.attachments || '[]').length > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Paperclip className="w-3 h-3" />
                              <span className="ml-1">{JSON.parse(card.attachments).length}</span>
                            </div>
                          )}
                          {card.comments && JSON.parse(card.comments || '[]').length > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <MessageSquare className="w-3 h-3" />
                              <span className="ml-1">{JSON.parse(card.comments).length}</span>
                            </div>
                          )}
                          {card.checklist && JSON.parse(card.checklist || '[]').length > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <CheckSquare className="w-3 h-3" />
                              <span className="ml-1">{JSON.parse(card.checklist).length}</span>
                            </div>
                          )}
                          {card.assignedUserName && (
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-gray-200 text-gray-700">
                                {card.assignedUserName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {/* Add Card Button */}
              <Button 
                variant="ghost" 
                className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-white/50 transition-colors"
                onClick={() => handleCreateCard(column.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add a card
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Card Dialog */}
      <Dialog open={showNewCardDialog} onOpenChange={setShowNewCardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Artwork Card</DialogTitle>
            <DialogDescription>
              Add a new artwork task to your board
            </DialogDescription>
          </DialogHeader>
          <Form {...cardForm}>
            <form onSubmit={cardForm.handleSubmit(onCreateCard)} className="space-y-4">
              <FormField
                control={cardForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter card title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cardForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={cardForm.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company: any) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={cardForm.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orders.map((order: any) => (
                            <SelectItem key={order.id} value={order.id}>
                              #{order.orderNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={cardForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={cardForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowNewCardDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCardMutation.isPending}>
                  Create Card
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}