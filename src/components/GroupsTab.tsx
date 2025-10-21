import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { Group, WordCard } from './types';

type GroupsTabProps = {
  groups: Group[];
  allCards: WordCard[];
  newGroup: {
    name: string;
    description: string;
    color: string;
  };
  selectedGroupId: number | null;
  selectedCardsForGroup: number[];
  addCardsDialogOpen: boolean;
  dialogSearchQuery: string;
  cardsSortBy: 'russian' | 'english' | 'category' | 'course';
  onNewGroupChange: (group: { name: string; description: string; color: string }) => void;
  onAddGroup: () => void;
  onDeleteGroup: (groupId: number) => void;
  onAddCardsDialogOpen: (open: boolean) => void;
  onSelectedGroupIdChange: (groupId: number | null) => void;
  onSelectedCardsChange: (cardIds: number[]) => void;
  onDialogSearchChange: (query: string) => void;
  onCardsSortByChange: (sortBy: 'russian' | 'english' | 'category' | 'course') => void;
  onAddCardsToGroup: (groupId: number) => void;
};

export default function GroupsTab({
  groups,
  allCards,
  newGroup,
  selectedGroupId,
  selectedCardsForGroup,
  addCardsDialogOpen,
  dialogSearchQuery,
  cardsSortBy,
  onNewGroupChange,
  onAddGroup,
  onDeleteGroup,
  onAddCardsDialogOpen,
  onSelectedGroupIdChange,
  onSelectedCardsChange,
  onDialogSearchChange,
  onCardsSortByChange,
  onAddCardsToGroup,
}: GroupsTabProps) {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | null>(null);

  const sortedAllCards = [...allCards]
    .filter((card) => {
      const query = dialogSearchQuery.toLowerCase();
      const matchesSearch = (
        card.russian.toLowerCase().includes(query) ||
        card.english.toLowerCase().includes(query)
      );
      const matchesCourse = selectedCourseFilter === null || (card.course || 1) === selectedCourseFilter;
      return matchesSearch && matchesCourse;
    })
    .sort((a, b) => {
      if (cardsSortBy === 'course') {
        return (a.course || 1) - (b.course || 1);
      } else if (cardsSortBy === 'russian') {
        return a.russian.localeCompare(b.russian);
      } else if (cardsSortBy === 'english') {
        return a.english.localeCompare(b.english);
      } else {
        return 0;
      }
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Icon name="Plus" size={18} />
            Создать группу
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая группа</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Название группы</Label>
              <Input
                value={newGroup.name}
                onChange={(e) => onNewGroupChange({ ...newGroup, name: e.target.value })}
                placeholder="Например: Базовый уровень"
              />
            </div>
            <div>
              <Label>Описание (опционально)</Label>
              <Input
                value={newGroup.description}
                onChange={(e) => onNewGroupChange({ ...newGroup, description: e.target.value })}
                placeholder="Описание группы"
              />
            </div>
            <div>
              <Label>Цвет группы</Label>
              <Input
                type="color"
                value={newGroup.color}
                onChange={(e) => onNewGroupChange({ ...newGroup, color: e.target.value })}
              />
            </div>
            <div>
              <Label>Курс</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((course) => (
                  <Button
                    key={course}
                    variant={(newGroup as any).course === course ? 'default' : 'outline'}
                    onClick={() => onNewGroupChange({ ...newGroup, course } as any)}
                    className="flex-1"
                  >
                    {course}
                  </Button>
                ))}
              </div>
            </div>
            <Button onClick={onAddGroup} className="w-full">
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow" style={{ borderLeft: `4px solid ${group.color}` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1" style={{ color: group.color }}>{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-gray-600">{group.description}</p>
                  )}
                  {group.course && (
                    <Badge variant="outline" className="mt-2">
                      {group.course} курс
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {group.cardCount} карт.
                </Badge>
              </div>

              <div className="flex gap-2 mt-4">
                <Dialog open={addCardsDialogOpen && selectedGroupId === group.id} onOpenChange={onAddCardsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onSelectedGroupIdChange(group.id);
                        onDialogSearchChange('');
                        onSelectedCardsChange([]);
                        onAddCardsDialogOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Icon name="Plus" size={16} className="mr-1" />
                      Добавить карточки
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Добавить карточки в группу "{group.name}"</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 pt-4">
                      <div className="relative">
                        <Icon
                          name="Search"
                          size={18}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <Input
                          placeholder="Поиск карточек..."
                          value={dialogSearchQuery}
                          onChange={(e) => onDialogSearchChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="space-y-2 pb-2">
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
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm text-gray-600">Сортировка:</span>
                          <Button
                            variant={cardsSortBy === 'course' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onCardsSortByChange('course')}
                          >
                            По курсам
                          </Button>
                          <Button
                            variant={cardsSortBy === 'russian' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onCardsSortByChange('russian')}
                          >
                            По русскому
                          </Button>
                          <Button
                            variant={cardsSortBy === 'english' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onCardsSortByChange('english')}
                          >
                            По английскому
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedCardsForGroup.length === sortedAllCards.length) {
                              onSelectedCardsChange([]);
                            } else {
                              onSelectedCardsChange(sortedAllCards.map(c => c.id));
                            }
                          }}
                          className="flex-1"
                        >
                          {selectedCardsForGroup.length === sortedAllCards.length ? 'Снять выбор' : 'Выбрать все'}
                        </Button>
                        <span className="text-sm text-gray-500">
                          Найдено: {sortedAllCards.length}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      {sortedAllCards.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>Нет доступных карточек</p>
                        </div>
                      )}
                      {sortedAllCards.map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            onSelectedCardsChange(
                              selectedCardsForGroup.includes(card.id)
                                ? selectedCardsForGroup.filter((id) => id !== card.id)
                                : [...selectedCardsForGroup, card.id]
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCardsForGroup.includes(card.id)}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{card.russian} — {card.english}</div>
                            {card.categoryName && (
                              <Badge variant="outline" className="mt-1">{card.categoryName}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => {
                        onAddCardsToGroup(group.id);
                      }}
                      disabled={selectedCardsForGroup.length === 0}
                      className="w-full mt-4"
                    >
                      Добавить {selectedCardsForGroup.length > 0 && `(${selectedCardsForGroup.length})`}
                    </Button>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteGroup(group.id)}
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}