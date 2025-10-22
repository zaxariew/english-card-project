import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { WordCard, Group } from './types';

type CardViewerProps = {
  currentCard: WordCard;
  currentCardIndex: number;
  totalCards: number;
  isFlipped: boolean;
  isAdmin: boolean;
  groups: Group[];
  selectedGroupId: number | null;
  newCard: {
    russian: string;
    russianExample: string;
    english: string;
    englishExample: string;
  };
  isTranslating: boolean;
  isShuffled: boolean;
  onFlip: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onMarkLearned: () => void;
  onPlaySound: (text: string, lang: 'ru-RU' | 'en-US') => void;
  onGroupChange: (groupId: number | null) => void;
  onNewCardChange: (card: any) => void;
  onAddCard: () => void;
  onTranslate: () => void;
  onShuffle: () => void;
};

export default function CardViewer({
  currentCard,
  currentCardIndex,
  totalCards,
  isFlipped,
  isAdmin,
  groups,
  selectedGroupId,
  newCard,
  isTranslating,
  isShuffled,
  onFlip,
  onNext,
  onPrevious,
  onMarkLearned,
  onPlaySound,
  onGroupChange,
  onNewCardChange,
  onAddCard,
  onTranslate,
  onShuffle,
}: CardViewerProps) {
  return (
    <div className="space-y-6 animate-scale-in">
      {groups.length > 0 && (
        <div className="flex gap-2 items-center mb-4">
          <Label className="text-sm font-medium">Группа:</Label>
          <select
            value={selectedGroupId || ''}
            onChange={(e) => onGroupChange(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Все карточки</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.cardCount})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Карточка {currentCardIndex + 1} из {totalCards}
          </div>
          <Button
            variant={isShuffled ? 'default' : 'outline'}
            size="sm"
            onClick={onShuffle}
            className="gap-2"
          >
            <Icon name="Shuffle" size={16} />
            {isShuffled ? 'Перемешано' : 'Перемешать'}
          </Button>
        </div>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
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

                <Button onClick={onAddCard} className="w-full">
                  Добавить
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="perspective-1000 max-w-2xl mx-auto">
        <div
          className={`relative w-full h-96 cursor-pointer transition-transform duration-600 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={onFlip}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.6s',
          }}
        >
          <Card
            className="absolute w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-2xl backface-hidden hover:shadow-3xl transition-shadow"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-6xl font-bold">{currentCard.russian}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySound(currentCard.russian, 'ru-RU');
                  }}
                >
                  <Icon name="Volume2" size={32} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl opacity-90 italic">"{currentCard.russianExample}"</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySound(currentCard.russianExample, 'ru-RU');
                  }}
                >
                  <Icon name="Volume2" size={20} />
                </Button>
              </div>
              <p className="text-sm opacity-70 mt-8">Нажми, чтобы перевернуть</p>
            </CardContent>
          </Card>

          <Card
            className={`absolute w-full h-full ${currentCard.categoryColor || 'bg-gradient-to-br from-purple-500 to-purple-600'} text-white shadow-2xl backface-hidden`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <Badge className="mb-4 bg-white/20 backdrop-blur-sm">
                {currentCard.categoryName || 'Без категории'}
              </Badge>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-6xl font-bold">{currentCard.english}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySound(currentCard.english, 'en-US');
                  }}
                >
                  <Icon name="Volume2" size={32} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl opacity-90 italic">"{currentCard.englishExample}"</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySound(currentCard.englishExample, 'en-US');
                  }}
                >
                  <Icon name="Volume2" size={20} />
                </Button>
              </div>
              <p className="text-sm opacity-70 mt-8">Нажми, чтобы перевернуть</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <Button variant="outline" size="lg" onClick={onPrevious} className="gap-2">
          <Icon name="ChevronLeft" size={20} />
          Назад
        </Button>
        <Button
          variant={currentCard.learned ? 'secondary' : 'default'}
          size="lg"
          onClick={onMarkLearned}
          className="gap-2"
        >
          <Icon name={currentCard.learned ? 'CheckCircle2' : 'Circle'} size={20} />
          {currentCard.learned ? 'Изучено' : 'Изучить'}
        </Button>
        <Button variant="outline" size="lg" onClick={onNext} className="gap-2">
          Вперёд
          <Icon name="ChevronRight" size={20} />
        </Button>
      </div>
    </div>
  );
}