import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { WordCard, Category } from './types';

type DictionaryProps = {
  cards: WordCard[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryId: number | null;
  isAdmin: boolean;
  newCard: {
    russian: string;
    russianExample: string;
    english: string;
    englishExample: string;
    categoryId: number;
  };
  isTranslating: boolean;
  onSearchChange: (query: string) => void;
  onCategoryFilter: (categoryId: number | null) => void;
  onCardClick: (cardId: number) => void;
  onEditCard: (card: WordCard) => void;
  onDeleteCard: (cardId: number) => void;
  onNewCardChange: (card: any) => void;
  onAddCard: () => void;
  onTranslate: () => void;
};

export default function Dictionary({
  cards,
  categories,
  searchQuery,
  selectedCategoryId,
  isAdmin,
  newCard,
  isTranslating,
  onSearchChange,
  onCategoryFilter,
  onCardClick,
  onEditCard,
  onDeleteCard,
  onNewCardChange,
  onAddCard,
  onTranslate,
}: DictionaryProps) {
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.russian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.english.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategoryId || card.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {isAdmin && (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 mb-4">
              <Icon name="Plus" size={18} />
              Добавить карточку
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая карточка</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Русское слово</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTranslate}
                    disabled={isTranslating || !newCard.russian.trim()}
                    className="gap-2"
                  >
                    <Icon name={isTranslating ? 'Loader2' : 'Sparkles'} size={16} className={isTranslating ? 'animate-spin' : ''} />
                    {isTranslating ? 'Перевожу...' : 'AI'}
                  </Button>
                </div>
                <Input
                  value={newCard.russian}
                  onChange={(e) => onNewCardChange({ ...newCard, russian: e.target.value })}
                  placeholder="Кот"
                />
              </div>
              <div>
                <Label>Пример (рус)</Label>
                <Input
                  value={newCard.russianExample}
                  onChange={(e) => onNewCardChange({ ...newCard, russianExample: e.target.value })}
                  placeholder="У меня есть кот"
                />
              </div>
              <div>
                <Label>Английское слово</Label>
                <Input
                  value={newCard.english}
                  onChange={(e) => onNewCardChange({ ...newCard, english: e.target.value })}
                  placeholder="Cat"
                />
              </div>
              <div>
                <Label>Пример (англ)</Label>
                <Input
                  value={newCard.englishExample}
                  onChange={(e) => onNewCardChange({ ...newCard, englishExample: e.target.value })}
                  placeholder="I have a cat"
                />
              </div>
              <div>
                <Label>Категория (необязательно)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant={!newCard.categoryId || newCard.categoryId === 0 ? 'default' : 'outline'}
                    onClick={() => onNewCardChange({ ...newCard, categoryId: 0 })}
                    className="w-full"
                  >
                    Без категории
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={newCard.categoryId === cat.id ? 'default' : 'outline'}
                      onClick={() => onNewCardChange({ ...newCard, categoryId: cat.id })}
                      className="w-full"
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={onAddCard} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Icon
            name="Search"
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Поиск по словарю..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategoryId === null ? 'default' : 'outline'}
            onClick={() => onCategoryFilter(null)}
            size="sm"
          >
            Все
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
              onClick={() => onCategoryFilter(cat.id)}
              size="sm"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <Card
            key={card.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onCardClick(card.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Badge className={card.categoryColor || 'bg-gray-500'}>{card.categoryName || 'Без категории'}</Badge>
                <div className="flex gap-1">
                  {isAdmin && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCard(card);
                        }}
                      >
                        <Icon name="Pencil" size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCard(card.id);
                        }}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </>
                  )}
                  {card.learned && (
                    <Icon name="CheckCircle2" size={18} className="text-green-500" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-lg font-semibold">{card.russian}</p>
                  <p className="text-sm text-gray-500 italic">{card.russianExample}</p>
                </div>
                <div className="border-t pt-2">
                  <p className="text-lg font-semibold">{card.english}</p>
                  <p className="text-sm text-gray-500 italic">{card.englishExample}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
