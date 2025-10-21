import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { WordCard } from './types';

type DictionaryProps = {
  cards: WordCard[];
  searchQuery: string;
  isAdmin: boolean;
  newCard: {
    russian: string;
    russianExample: string;
    english: string;
    englishExample: string;
  };
  isTranslating: boolean;
  onSearchChange: (query: string) => void;
  onCardClick: (cardId: number) => void;
  onEditCard: (card: WordCard) => void;
  onDeleteCard: (cardId: number) => void;
  onNewCardChange: (card: any) => void;
  onAddCard: () => void;
  onTranslate: () => void;
};

export default function Dictionary({
  cards,
  searchQuery,
  isAdmin,
  newCard,
  isTranslating,
  onSearchChange,
  onCardClick,
  onEditCard,
  onDeleteCard,
  onNewCardChange,
  onAddCard,
  onTranslate,
}: DictionaryProps) {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'course' | 'russian' | 'english'>('course');

  const filteredCards = cards
    .filter((card) => {
      const matchesSearch =
        card.russian.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.english.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = selectedCourseFilter === null || (card.course || 1) === selectedCourseFilter;
      return matchesSearch && matchesCourse;
    })
    .sort((a, b) => {
      if (sortBy === 'course') {
        return (a.course || 1) - (b.course || 1);
      } else if (sortBy === 'russian') {
        return a.russian.localeCompare(b.russian);
      } else {
        return a.english.localeCompare(b.english);
      }
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

              {isAdmin && (
                <div>
                  <Label>Курс</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((course) => (
                      <Button
                        key={course}
                        variant={(newCard as any).course === course ? 'default' : 'outline'}
                        onClick={() => onNewCardChange({ ...newCard, course })}
                        className="flex-1"
                      >
                        {course}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={onAddCard} className="w-full">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-4">
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Курс:</span>
          <Button
            variant={selectedCourseFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCourseFilter(null)}
          >
            Все
          </Button>
          {[1, 2, 3, 4, 5].map((course) => (
            <Button
              key={course}
              variant={selectedCourseFilter === course ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCourseFilter(course)}
            >
              {course}
            </Button>
          ))}
          <div className="border-l h-6 mx-2"></div>
          <span className="text-sm text-gray-600">Сортировка:</span>
          <Button
            variant={sortBy === 'course' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('course')}
          >
            По курсам
          </Button>
          <Button
            variant={sortBy === 'russian' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('russian')}
          >
            По русскому
          </Button>
          <Button
            variant={sortBy === 'english' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('english')}
          >
            По английскому
          </Button>
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
                <div className="flex gap-2 items-center">
                  {card.course && (
                    <Badge variant="outline" className="text-xs">
                      {card.course} курс
                    </Badge>
                  )}
                </div>
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