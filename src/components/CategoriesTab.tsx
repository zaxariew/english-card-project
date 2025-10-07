import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { Category, WordCard, colorOptions } from './types';

type CategoriesTabProps = {
  categories: Category[];
  cards: WordCard[];
  isAdmin: boolean;
  newCategory: {
    name: string;
    color: string;
  };
  onNewCategoryChange: (category: { name: string; color: string }) => void;
  onAddCategory: () => void;
  onCategoryClick: (categoryId: number) => void;
};

export default function CategoriesTab({
  categories,
  cards,
  isAdmin,
  newCategory,
  onNewCategoryChange,
  onAddCategory,
  onCategoryClick,
}: CategoriesTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end mb-4">
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Icon name="Plus" size={18} />
                Добавить категорию
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая категория</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Название категории</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => onNewCategoryChange({ ...newCategory, name: e.target.value })}
                    placeholder="Спорт"
                  />
                </div>
                <div>
                  <Label>Цвет</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <Button
                        key={color.value}
                        variant={newCategory.color === color.value ? 'default' : 'outline'}
                        onClick={() => onNewCategoryChange({ ...newCategory, color: color.value })}
                        className="w-full"
                      >
                        <div className={`w-4 h-4 rounded mr-2 ${color.value}`}></div>
                        {color.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={onAddCategory} className="w-full">
                  Добавить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const categoryCards = cards.filter((c) => c.categoryId === cat.id);
          const learned = categoryCards.filter((c) => c.learned).length;

          return (
            <Card
              key={cat.id}
              className={`${cat.color} text-white overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer`}
              onClick={() => onCategoryClick(cat.id)}
            >
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-3xl font-bold">{cat.name}</h3>
                  <Badge className="bg-white/20 backdrop-blur-sm text-lg px-3 py-1">
                    {categoryCards.length}
                  </Badge>
                </div>
                <p className="text-white/80 mb-6">{learned} изучено</p>
                <Progress
                  value={categoryCards.length ? (learned / categoryCards.length) * 100 : 0}
                  className="h-2 bg-white/20"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
