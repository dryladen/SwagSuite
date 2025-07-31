import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus,
  MoreHorizontal,
  Calendar,
  User,
  FileImage,
  MessageSquare,
  Palette,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  GripVertical,
  X
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ArtworkColumn {
  id: string;
  name: string;
  position: number;
  color: string;
  isDefault: boolean;
}

interface ArtworkCard {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  orderId?: string;
  companyId?: string;
  assignedUserId?: string;
  position: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  labels?: string[];
  attachments?: string[];
  checklist?: Array<{ id: string; text: string; completed: boolean }>;
  comments?: Array<{ id: string; text: string; author: string; createdAt: string }>;
  // Associated data
  orderNumber?: string;
  companyName?: string;
  assignedUserName?: string;
}

const defaultColumns: ArtworkColumn[] = [
  { id: 'pms-colors', name: 'PMS Colors', position: 0, color: '#8B5CF6', isDefault: true },
  { id: 'artist-schedule', name: 'Artist Schedule', position: 1, color: '#06B6D4', isDefault: true },
  { id: 'artwork-todo', name: 'Artwork to Do', position: 2, color: '#F59E0B', isDefault: true },
  { id: 'in-progress', name: 'In Progress', position: 3, color: '#3B82F6', isDefault: true },
  { id: 'questions', name: 'Questions & Clarifications', position: 4, color: '#EF4444', isDefault: true },
  { id: 'for-review', name: 'For Review', position: 5, color: '#F97316', isDefault: true },
  { id: 'sent-to-client', name: 'Sent to Client', position: 6, color: '#10B981', isDefault: true },
  { id: 'completed', name: 'Completed', position: 7, color: '#22C55E', isDefault: true },
];

export default function ArtworkPage() {
  const { toast } = useToast();
  const [draggedCard, setDraggedCard] = useState<ArtworkCard | null>(null);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  const [selectedCard, setSelectedCard] = useState<ArtworkCard | null>(null);
  const [isNewCardDialogOpen, setIsNewCardDialogOpen] = useState(false);
  const [newCardColumnId, setNewCardColumnId] = useState<string>("");
  const dragCounter = useRef(0);

  // Fetch columns and cards
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ['/api/artwork/columns'],
    retry: false,
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/artwork/cards'],
    retry: false,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
    retry: false,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/companies'],
    retry: false,
  });

  // Initialize columns if none exist
  const initializeColumnsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/artwork/columns/initialize', {
        method: 'POST',
        body: { columns: defaultColumns }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artwork/columns'] });
      toast({
        title: "Success",
        description: "Artwork board initialized successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to initialize artwork board.",
        variant: "destructive",
      });
    },
  });

  // Create new column
  const createColumnMutation = useMutation({
    mutationFn: async (name: string) => {
      const position = Math.max(...(columns.length ? columns.map(c => c.position) : [0])) + 1;
      return apiRequest('/api/artwork/columns', {
        method: 'POST',
        body: { name, position, color: '#6B7280' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artwork/columns'] });
      setNewColumnName("");
      toast({
        title: "Success",
        description: "New column created successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create column.",
        variant: "destructive",
      });
    },
  });

  // Create new card
  const createCardMutation = useMutation({
    mutationFn: async (cardData: any) => {
      const cardsInColumn = cards.filter(c => c.columnId === cardData.columnId);
      const position = Math.max(...(cardsInColumn.length ? cardsInColumn.map(c => c.position) : [0])) + 1;
      return apiRequest('/api/artwork/cards', {
        method: 'POST',
        body: { ...cardData, position }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artwork/cards'] });
      setIsNewCardDialogOpen(false);
      setSelectedCard(null);
      toast({
        title: "Success",
        description: "Artwork card created successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create artwork card.",
        variant: "destructive",
      });
    },
  });

  // Move card between columns
  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, newColumnId, newPosition }: { cardId: string; newColumnId: string; newPosition: number }) => {
      return apiRequest(`/api/artwork/cards/${cardId}/move`, {
        method: 'PATCH',
        body: { columnId: newColumnId, position: newPosition }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/artwork/cards'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to move card.",
        variant: "destructive",
      });
    },
  });

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, card: ArtworkCard) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    dragCounter.current++;
    setDraggedOver(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedOver(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDraggedOver(null);

    if (draggedCard && draggedCard.columnId !== columnId) {
      const cardsInNewColumn = cards.filter(c => c.columnId === columnId);
      const newPosition = cardsInNewColumn.length;
      
      moveCardMutation.mutate({
        cardId: draggedCard.id,
        newColumnId: columnId,
        newPosition
      });
    }

    setDraggedCard(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-3 w-3" />;
      case 'high': return <Clock className="h-3 w-3" />;
      case 'medium': return <Calendar className="h-3 w-3" />;
      case 'low': return <CheckCircle className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  if (columnsLoading || cardsLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // If no columns exist, show initialization
  if (!columns.length) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Artwork Management</h1>
          </div>
          
          <div className="text-center py-12">
            <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Set up your Artwork Board</h3>
            <p className="text-gray-600 mb-6">
              Initialize your Kanban board with default columns to start managing artwork projects.
            </p>
            <Button 
              onClick={() => initializeColumnsMutation.mutate()}
              disabled={initializeColumnsMutation.isPending}
            >
              {initializeColumnsMutation.isPending ? "Setting up..." : "Initialize Artwork Board"}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Artwork Management</h1>
          
          <div className="flex items-center space-x-3">
            <Input
              placeholder="Add new column"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="w-48"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newColumnName.trim()) {
                  createColumnMutation.mutate(newColumnName.trim());
                }
              }}
            />
            <Button 
              onClick={() => newColumnName.trim() && createColumnMutation.mutate(newColumnName.trim())}
              disabled={!newColumnName.trim() || createColumnMutation.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="flex space-x-4 pb-4" style={{ minWidth: `${sortedColumns.length * 300}px` }}>
            {sortedColumns.map((column) => {
              const columnCards = cards.filter(card => card.columnId === column.id)
                .sort((a, b) => a.position - b.position);

              return (
                <div
                  key={column.id}
                  className={`flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 ${
                    draggedOver === column.id ? 'bg-blue-50 border-2 border-blue-300' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      ></div>
                      <h3 className="font-semibold text-gray-900">{column.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {columnCards.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewCardColumnId(column.id);
                        setIsNewCardDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {columnCards.map((card) => (
                      <Card
                        key={card.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => handleDragStart(e, card)}
                        onClick={() => setSelectedCard(card)}
                      >
                        <CardContent className="p-4 space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 line-clamp-2">
                              {card.title}
                            </h4>
                            <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>

                          {/* Description */}
                          {card.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {card.description}
                            </p>
                          )}

                          {/* Labels */}
                          {card.labels && card.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {card.labels.slice(0, 3).map((label, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                              {card.labels.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{card.labels.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Order and Company Info */}
                          {(card.orderNumber || card.companyName) && (
                            <div className="text-xs text-gray-500 space-y-1">
                              {card.orderNumber && (
                                <div className="flex items-center space-x-1">
                                  <FileImage className="h-3 w-3" />
                                  <span>Order: {card.orderNumber}</span>
                                </div>
                              )}
                              {card.companyName && (
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{card.companyName}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Card Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                className={`text-xs ${getPriorityColor(card.priority)}`}
                                variant="outline"
                              >
                                {getPriorityIcon(card.priority)}
                                <span className="ml-1 capitalize">{card.priority}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              {card.attachments && card.attachments.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <FileImage className="h-3 w-3" />
                                  <span>{card.attachments.length}</span>
                                </div>
                              )}
                              {card.comments && card.comments.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{card.comments.length}</span>
                                </div>
                              )}
                              {card.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(new Date(card.dueDate), 'MMM dd')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Card Dialog */}
        <Dialog open={isNewCardDialogOpen} onOpenChange={setIsNewCardDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Artwork Card</DialogTitle>
            </DialogHeader>
            <NewCardForm
              columnId={newCardColumnId}
              orders={orders}
              companies={companies}
              onSubmit={(cardData) => createCardMutation.mutate(cardData)}
              onCancel={() => setIsNewCardDialogOpen(false)}
              isLoading={createCardMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Card Details Dialog */}
        <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedCard?.title}</DialogTitle>
            </DialogHeader>
            {selectedCard && (
              <CardDetailsView
                card={selectedCard}
                onClose={() => setSelectedCard(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

// New Card Form Component
function NewCardForm({ columnId, orders, companies, onSubmit, onCancel, isLoading }: {
  columnId: string;
  orders: any[];
  companies: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderId: '',
    companyId: '',
    priority: 'medium',
    dueDate: '',
    labels: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      columnId,
      labels: formData.labels.length ? formData.labels : undefined,
      dueDate: formData.dueDate || undefined,
      orderId: formData.orderId || undefined,
      companyId: formData.companyId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter card title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter card description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orderId">Related Order</Label>
          <Select value={formData.orderId} onValueChange={(value) => setFormData(prev => ({ ...prev, orderId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select an order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No order</SelectItem>
              {orders.map((order) => (
                <SelectItem key={order.id} value={order.id}>
                  {order.orderNumber} - ${order.total}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyId">Related Company</Label>
          <Select value={formData.companyId} onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No company</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.title.trim()}>
          {isLoading ? "Creating..." : "Create Card"}
        </Button>
      </div>
    </form>
  );
}

// Card Details View Component
function CardDetailsView({ card, onClose }: { card: ArtworkCard; onClose: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{card.title}</h3>
          {card.description && (
            <p className="text-gray-600">{card.description}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Priority:</span>
                <Badge className={getPriorityColor(card.priority)} variant="outline">
                  {card.priority}
                </Badge>
              </div>
              {card.dueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <span>{format(new Date(card.dueDate), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {card.orderNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Order:</span>
                  <span>{card.orderNumber}</span>
                </div>
              )}
              {card.companyName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Company:</span>
                  <span>{card.companyName}</span>
                </div>
              )}
            </div>
          </div>

          {card.labels && card.labels.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Labels</h4>
              <div className="flex flex-wrap gap-2">
                {card.labels.map((label, index) => (
                  <Badge key={index} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {card.checklist && card.checklist.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Checklist</h4>
              <div className="space-y-2">
                {card.checklist.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${item.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {card.comments && card.comments.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {card.comments.map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-200 pl-3">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium">{comment.author}</span>
                      <span>{format(new Date(comment.createdAt), 'MMM dd, HH:mm')}</span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}