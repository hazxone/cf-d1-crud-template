import type { Route } from "./+types/memory";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, MoreHorizontal, Edit, Trash2, CheckCircle2, XCircle, Pin, Archive, Clock, Calendar, Tag as TagIcon, PlusCircle, X, Search, ListTodo, Brain, Lightbulb } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import type { ItemType, Priority, ItemWithTags, Tag, User, ViewMode, ApiResponse } from "@/types/pkm";

// Page metadata
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Memory - PKM System" },
    { name: "description", content: "Personal Knowledge Management - Tasks, Notes & Thoughts" },
  ];
}

export default function MemoryPage({ }: Route.ComponentProps) {
  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Items and tags state
  const [items, setItems] = useState<ItemWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [inputContent, setInputContent] = useState("");
  const [selectedItemType, setSelectedItemType] = useState<ItemType>("task");
  const [selectedPriority, setSelectedPriority] = useState<Priority>(null);
  const [editingItem, setEditingItem] = useState<ItemWithTags | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemWithTags | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [tagFilter, setTagFilter] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Tag management
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        toast.error("Failed to load user data");
        window.location.href = "/login";
      }
    } else {
      toast.error("Please log in first");
      window.location.href = "/login";
    }
  }, []);

  // Fetch items and tags when user is loaded
  useEffect(() => {
    if (currentUser) {
      fetchItems();
      fetchTags();
    }
  }, [currentUser]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 'n' for new note
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSelectedItemType('note');
        document.getElementById('item-input')?.focus();
      }
      // 't' for new task
      if (e.key === 't' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setSelectedItemType('task');
        document.getElementById('item-input')?.focus();
      }
      // '/' for search
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const fetchItems = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`http://localhost:5173/api/items/${currentUser.id}`);
      const data = await response.json() as ApiResponse<ItemWithTags[]>;

      if (data.success && data.data) {
        setItems(data.data);
      } else {
        toast.error("Failed to fetch items");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to fetch items");
    }
  };

  const fetchTags = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`http://localhost:5173/api/tags/${currentUser.id}`);
      const data = await response.json() as ApiResponse<Tag[]>;

      if (data.success && data.data) {
        setTags(data.data);
      } else {
        toast.error("Failed to fetch tags");
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to fetch tags");
    }
  };

  const handleAddOrUpdateItem = async () => {
    if (!currentUser || !inputContent.trim()) return;

    try {
      if (editingItem) {
        // Update existing item
        const response = await fetch(`http://localhost:5173/api/items/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: inputContent,
            item_type: selectedItemType,
            priority: selectedPriority,
            tags: selectedTags,
          }),
        });

        const data = await response.json() as ApiResponse<ItemWithTags>;

        if (data.success) {
          toast.success("Item updated successfully");
          setEditingItem(null);
        } else {
          toast.error("Failed to update item");
        }
      } else {
        // Create new item
        const response = await fetch("http://localhost:5173/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            content: inputContent,
            item_type: selectedItemType,
            priority: selectedPriority,
            tags: selectedTags,
          }),
        });

        const data = await response.json() as ApiResponse<ItemWithTags>;

        if (data.success) {
          toast.success(`${selectedItemType.charAt(0).toUpperCase() + selectedItemType.slice(1)} added successfully`);
        } else {
          toast.error("Failed to add item");
        }
      }

      // Reset form
      setInputContent("");
      setSelectedTags([]);
      setSelectedPriority(null);
      await fetchItems();
    } catch (error) {
      console.error("Error adding/updating item:", error);
      toast.error("Failed to save item");
    }
  };

  const handleToggleComplete = async (item: ItemWithTags) => {
    try {
      const response = await fetch(`http://localhost:5173/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !item.completed }),
      });

      const data = await response.json() as ApiResponse<ItemWithTags>;

      if (data.success) {
        toast.success(item.completed ? "Marked as pending" : "Marked as complete");
        await fetchItems();
      } else {
        toast.error("Failed to update item");
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
      toast.error("Failed to update item");
    }
  };

  const handleTogglePin = async (item: ItemWithTags) => {
    try {
      const response = await fetch(`http://localhost:5173/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !item.pinned }),
      });

      const data = await response.json() as ApiResponse<ItemWithTags>;

      if (data.success) {
        toast.success(item.pinned ? "Unpinned" : "Pinned");
        await fetchItems();
      } else {
        toast.error("Failed to update item");
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to update item");
    }
  };

  const handleArchive = async (item: ItemWithTags) => {
    try {
      const response = await fetch(`http://localhost:5173/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });

      const data = await response.json() as ApiResponse<ItemWithTags>;

      if (data.success) {
        toast.success("Item archived");
        await fetchItems();
      } else {
        toast.error("Failed to archive item");
      }
    } catch (error) {
      console.error("Error archiving item:", error);
      toast.error("Failed to archive item");
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`http://localhost:5173/api/items/${itemToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json() as ApiResponse<void>;

      if (data.success) {
        toast.success("Item deleted successfully");
        setItemToDelete(null);
        await fetchItems();
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleEditItem = (item: ItemWithTags) => {
    setEditingItem(item);
    setInputContent(item.content);
    setSelectedItemType(item.item_type);
    setSelectedPriority(item.priority);
    setSelectedTags(item.tags.map(t => t.id));
    document.getElementById('item-input')?.focus();
  };

  const handleCreateTag = async () => {
    if (!currentUser || !newTagName.trim()) return;

    try {
      const response = await fetch("http://localhost:5173/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name: newTagName,
          color: newTagColor,
        }),
      });

      const data = await response.json() as ApiResponse<Tag>;

      if (data.success) {
        toast.success("Tag created successfully");
        setNewTagName("");
        setNewTagColor("#6366f1");
        setShowTagDialog(false);
        await fetchTags();
      } else {
        toast.error(data.error || "Failed to create tag");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      const response = await fetch(`http://localhost:5173/api/tags/${tagId}`, {
        method: "DELETE",
      });

      const data = await response.json() as ApiResponse<void>;

      if (data.success) {
        toast.success("Tag deleted successfully");
        await fetchTags();
        await fetchItems();
      } else {
        toast.error("Failed to delete tag");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast.error("Failed to delete tag");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast.success("Logged out successfully");
    window.location.href = "/login";
  };

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    const statusMatch = statusFilter === "all" ? true :
      statusFilter === "completed" ? item.completed : !item.completed;
    const typeMatch = typeFilter === "all" ? true : item.item_type === typeFilter;
    const tagMatch = tagFilter.length === 0 ? true :
      tagFilter.some(tagId => item.tags.some(t => t.id === tagId));
    const searchMatch = searchQuery === "" ? true :
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && typeMatch && tagMatch && searchMatch;
  });

  // Separate pinned and regular items
  const pinnedItems = filteredItems.filter(item => item.pinned);
  const regularItems = filteredItems.filter(item => !item.pinned);

  // Get item type icon and color
  const getItemTypeDisplay = (type: ItemType) => {
    switch (type) {
      case 'task': return { icon: <ListTodo className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'note': return { icon: <Brain className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' };
      case 'thought': return { icon: <Lightbulb className="w-4 h-4" />, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    }
  };

  // Get priority color
  const getPriorityColor = (priority: Priority) => {
    if (!priority) return 'bg-gray-100 text-gray-600';
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-green-100 text-green-700';
    }
  };

  // Stats
  const stats = {
    total: items.length,
    completed: items.filter(i => i.completed && i.item_type === 'task').length,
    pending: items.filter(i => !i.completed && i.item_type === 'task').length,
    tasks: items.filter(i => i.item_type === 'task').length,
    notes: items.filter(i => i.item_type === 'note').length,
    thoughts: items.filter(i => i.item_type === 'thought').length,
  };

  const completionPercentage = stats.tasks > 0 ? Math.round((stats.completed / stats.tasks) * 100) : 0;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-amber-50/50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/50">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-amber-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Memory</h1>
                <p className="text-sm text-gray-600">Personal Knowledge Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => window.location.href = "/"}>
                Home
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={currentUser.avatar_url} alt={currentUser.username} />
                      <AvatarFallback>{currentUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{currentUser.first_name} {currentUser.last_name}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/70 border-amber-200/50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">Total Items</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 border-blue-200/50">
            <CardContent className="p-4">
              <div className="text-sm text-blue-600 flex items-center gap-1">
                <ListTodo className="w-4 h-4" /> Tasks
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.tasks}</div>
              <div className="text-xs text-gray-500">{stats.completed} completed</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 border-purple-200/50">
            <CardContent className="p-4">
              <div className="text-sm text-purple-600 flex items-center gap-1">
                <Brain className="w-4 h-4" /> Notes
              </div>
              <div className="text-2xl font-bold text-purple-900">{stats.notes}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 border-yellow-200/50">
            <CardContent className="p-4">
              <div className="text-sm text-yellow-600 flex items-center gap-1">
                <Lightbulb className="w-4 h-4" /> Thoughts
              </div>
              <div className="text-2xl font-bold text-yellow-900">{stats.thoughts}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card className="bg-white/70 border-amber-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Memory Space</CardTitle>
                <CardDescription>
                  Capture tasks, notes, and thoughts • {filteredItems.length} items shown
                </CardDescription>
              </div>
              <Button onClick={() => setShowTagDialog(true)} variant="outline" size="sm">
                <TagIcon className="w-4 h-4 mr-2" />
                Manage Tags
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Input Section */}
            <div className="space-y-3 p-4 bg-amber-50/50 rounded-lg border border-amber-200/50">
              <div className="flex items-center gap-2">
                <Select value={selectedItemType} onValueChange={(value) => setSelectedItemType(value as ItemType)}>
                  <SelectTrigger className="w-[140px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4" />
                        <span>Task</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="note">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        <span>Note</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="thought">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        <span>Thought</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  id="item-input"
                  placeholder={`What's on your mind? (${selectedItemType})...`}
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddOrUpdateItem();
                    if (e.key === "Escape") {
                      setEditingItem(null);
                      setInputContent("");
                      setSelectedTags([]);
                    }
                  }}
                  className="flex-1 bg-white"
                />

                <Button onClick={handleAddOrUpdateItem} className="bg-amber-600 hover:bg-amber-700">
                  {editingItem ? "Update" : "Add"}
                </Button>

                {editingItem && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingItem(null);
                      setInputContent("");
                      setSelectedTags([]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Tag selection */}
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-xs text-gray-600">Tags:</Label>
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent', color: selectedTags.includes(tag.id) ? 'white' : tag.color, borderColor: tag.color }}
                    className="cursor-pointer border"
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-gray-500">No tags yet. Click "Manage Tags" to create one.</span>
                )}
              </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search-input"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-full md:w-[180px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="thought">Thoughts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tag Filter */}
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Label className="text-sm text-gray-600">Filter by tags:</Label>
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: tagFilter.includes(tag.id) ? tag.color : 'transparent', color: tagFilter.includes(tag.id) ? 'white' : tag.color, borderColor: tag.color }}
                    className="cursor-pointer border"
                    onClick={() => {
                      setTagFilter(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {tagFilter.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setTagFilter([])}>
                    Clear
                  </Button>
                )}
              </div>
            )}

            {/* Task Progress (for tasks only) */}
            {stats.tasks > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Task Completion</span>
                  <span className="font-medium text-gray-900">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
            )}

            {/* Pinned Items Section */}
            {pinnedItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Pinned Items</h3>
                </div>
                <div className="space-y-2">
                  {pinnedItems.map(item => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onToggleComplete={handleToggleComplete}
                      onTogglePin={handleTogglePin}
                      onArchive={handleArchive}
                      onEdit={handleEditItem}
                      onDelete={setItemToDelete}
                      getItemTypeDisplay={getItemTypeDisplay}
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Items */}
            <div className="space-y-2">
              {regularItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No items found. Start capturing your thoughts!</p>
                </div>
              ) : (
                regularItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onTogglePin={handleTogglePin}
                    onArchive={handleArchive}
                    onEdit={handleEditItem}
                    onDelete={setItemToDelete}
                    getItemTypeDisplay={getItemTypeDisplay}
                    getPriorityColor={getPriorityColor}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts Help */}
        <Card className="mt-4 bg-white/50 border-amber-200/30">
          <CardContent className="p-4">
            <p className="text-xs text-gray-600">
              <strong>Keyboard Shortcuts:</strong> <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">N</kbd> New Note •
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mx-1">T</kbd> New Task •
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">/</kbd> Search •
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mx-1">Esc</kbd> Cancel Edit
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tag Management Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Create, edit, or delete tags to organize your items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Create new tag */}
            <div className="flex gap-2">
              <Input
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <Button onClick={handleCreateTag}>Add</Button>
            </div>

            {/* Existing tags */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center justify-between p-2 rounded border bg-gray-50">
                  <Badge style={{ backgroundColor: tag.color, color: 'white' }}>
                    {tag.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4">No tags yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Item Card Component
function ItemCard({
  item,
  onToggleComplete,
  onTogglePin,
  onArchive,
  onEdit,
  onDelete,
  getItemTypeDisplay,
  getPriorityColor,
}: {
  item: ItemWithTags;
  onToggleComplete: (item: ItemWithTags) => void;
  onTogglePin: (item: ItemWithTags) => void;
  onArchive: (item: ItemWithTags) => void;
  onEdit: (item: ItemWithTags) => void;
  onDelete: (item: ItemWithTags) => void;
  getItemTypeDisplay: (type: ItemType) => { icon: React.ReactElement; color: string; bg: string };
  getPriorityColor: (priority: Priority) => string;
}) {
  const typeDisplay = getItemTypeDisplay(item.item_type);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow">
      {/* Checkbox for tasks */}
      {item.item_type === 'task' && (
        <Checkbox
          checked={item.completed}
          onCheckedChange={() => onToggleComplete(item)}
          className="mt-1"
        />
      )}

      {/* Item type icon */}
      <div className={`p-2 rounded ${typeDisplay.bg} ${typeDisplay.color} shrink-0`}>
        {typeDisplay.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {item.content}
          </p>
          <div className="flex items-center gap-1">
            {item.pinned && <Pin className="w-3 h-3 text-amber-600 shrink-0" />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePin(item)}>
                  <Pin className="mr-2 h-4 w-4" />
                  {item.pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(item)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tags and metadata */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {item.tags.map(tag => (
            <Badge key={tag.id} style={{ backgroundColor: tag.color, color: 'white' }} className="text-xs">
              {tag.name}
            </Badge>
          ))}
          {item.priority && (
            <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
              {item.priority}
            </Badge>
          )}
          <span className="text-xs text-gray-400">
            {new Date(item.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
