import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WordCard, Category } from './types';

type EditCardDialogProps = {
  open: boolean;
  editingCard: WordCard | null;
  categories: Category[];
  onOpenChange: (open: boolean) => void;
  onEditingCardChange: (card: WordCard) => void;
  onSave: () => void;
};

export default function EditCardDialog({
  open,
  editingCard,
  categories,
  onOpenChange,
  onEditingCardChange,
  onSave,
}: EditCardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать карточку</DialogTitle>
        </DialogHeader>
        {editingCard && (
          <div className="space-y-4 pt-4">
            <div>
              <Label>Русское слово</Label>
              <Input
                value={editingCard.russian}
                onChange={(e) => onEditingCardChange({ ...editingCard, russian: e.target.value })}
              />
            </div>
            <div>
              <Label>Пример (рус)</Label>
              <Input
                value={editingCard.russianExample}
                onChange={(e) => onEditingCardChange({ ...editingCard, russianExample: e.target.value })}
              />
            </div>
            <div>
              <Label>Английское слово</Label>
              <Input
                value={editingCard.english}
                onChange={(e) => onEditingCardChange({ ...editingCard, english: e.target.value })}
              />
            </div>
            <div>
              <Label>Пример (англ)</Label>
              <Input
                value={editingCard.englishExample}
                onChange={(e) => onEditingCardChange({ ...editingCard, englishExample: e.target.value })}
              />
            </div>
            <div>
              <Label>Категория</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={editingCard.categoryId === cat.id ? 'default' : 'outline'}
                    onClick={() => onEditingCardChange({ ...editingCard, categoryId: cat.id })}
                    className="w-full"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} className="flex-1">Сохранить</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Отмена</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
