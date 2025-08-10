import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface CategoryManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

interface SortableCategoryItemProps {
  category: string;
  onDelete: (category: string) => void;
}

const SortableCategoryItem: React.FC<SortableCategoryItemProps> = ({
  category,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between p-2 border rounded-md bg-white shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" {...listeners} className="cursor-grab">
          <GripVertical className="w-4 h-4 text-gray-500" />
        </Button>
        <span>{category}</span>
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete(category)}
      >
        삭제
      </Button>
    </div>
  );
};

export const CategoryManagementDialog: React.FC<CategoryManagementDialogProps> = ({
  isOpen,
  onClose,
  storeId,
}) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stores/${storeId}/categories`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateCategoriesOnBackend = async (updatedCategories: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stores/${storeId}/categories`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: updatedCategories }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update categories");
      }
      // No need to setCategories here, as it's done by onDragEnd or other handlers
    } catch (err: any) {
      setError(err.message);
      // Revert local state if backend update fails
      fetchCategories(); 
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || categories.includes(newCategory.trim())) return;

    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    setNewCategory("");
    await updateCategoriesOnBackend(updatedCategories);
  };

  const handleDeleteCategory = async (categoryToDelete: string) => {
    const updatedCategories = categories.filter((cat) => cat !== categoryToDelete);
    setCategories(updatedCategories);
    await updateCategoriesOnBackend(updatedCategories);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categories.indexOf(active.id);
      const newIndex = categories.indexOf(over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      setCategories(newOrder);
      await updateCategoriesOnBackend(newOrder);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>카테고리 관리</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <div className="flex items-center space-x-2">
            <Input
              id="newCategory"
              placeholder="새 카테고리 추가"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleAddCategory} disabled={loading || !newCategory.trim()}>
              추가
            </Button>
          </div>
          <div className="space-y-2">
            {categories.length === 0 && !loading && <p className="text-gray-500 text-center">등록된 카테고리가 없습니다.</p>}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories}
                strategy={verticalListSortingStrategy}
              >
                {categories.map((category) => (
                  <SortableCategoryItem
                    key={category}
                    category={category}
                    onDelete={handleDeleteCategory}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>닫기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to move array elements
function arrayMove<T>(array: T[], oldIndex: number, newIndex: number): T[] {
  const newArray = [...array];
  if (newIndex >= newArray.length) {
    let k = newIndex - newArray.length + 1;
    while (k--) {
      newArray.push(undefined as any);
    }
  }
  newArray.splice(newIndex, 0, newArray.splice(oldIndex, 1)[0]);
  return newArray;
}
