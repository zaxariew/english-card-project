import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type WordCard = {
  id: string;
  russian: string;
  russianExample: string;
  english: string;
  englishExample: string;
  category: 'animals' | 'food' | 'travel' | 'work';
  learned: boolean;
};

const categoryColors = {
  animals: 'bg-gradient-to-br from-purple-500 to-purple-600',
  food: 'bg-gradient-to-br from-pink-500 to-pink-600',
  travel: 'bg-gradient-to-br from-orange-500 to-orange-600',
  work: 'bg-gradient-to-br from-blue-500 to-blue-600',
};

const categoryLabels = {
  animals: 'Животные',
  food: 'Еда',
  travel: 'Путешествия',
  work: 'Работа',
};

const initialCards: WordCard[] = [
  {
    id: '1',
    russian: 'Кот',
    russianExample: 'У меня есть кот',
    english: 'Cat',
    englishExample: 'I have a cat',
    category: 'animals',
    learned: false,
  },
  {
    id: '2',
    russian: 'Яблоко',
    russianExample: 'Я люблю яблоки',
    english: 'Apple',
    englishExample: 'I love apples',
    category: 'food',
    learned: false,
  },
  {
    id: '3',
    russian: 'Самолёт',
    russianExample: 'Самолёт летит высоко',
    english: 'Airplane',
    englishExample: 'The airplane flies high',
    category: 'travel',
    learned: true,
  },
  {
    id: '4',
    russian: 'Работа',
    russianExample: 'Я иду на работу',
    english: 'Work',
    englishExample: 'I go to work',
    category: 'work',
    learned: false,
  },
  {
    id: '5',
    russian: 'Собака',
    russianExample: 'Собака лает',
    english: 'Dog',
    englishExample: 'The dog barks',
    category: 'animals',
    learned: true,
  },
];

export default function Index() {
  const [cards, setCards] = useState<WordCard[]>(initialCards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({
    russian: '',
    russianExample: '',
    english: '',
    englishExample: '',
    category: 'animals' as WordCard['category'],
  });

  const currentCard = cards[currentCardIndex];
  const learnedCount = cards.filter((c) => c.learned).length;
  const progressPercentage = (learnedCount / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleMarkLearned = () => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === currentCard.id ? { ...card, learned: !card.learned } : card
      )
    );
    toast.success(
      currentCard.learned ? 'Карточка отмечена как не изученная' : 'Отлично! Слово изучено'
    );
  };

  const handleAddCard = () => {
    if (!newCard.russian || !newCard.english) {
      toast.error('Заполните русское и английское слово');
      return;
    }

    const card: WordCard = {
      id: Date.now().toString(),
      ...newCard,
      learned: false,
    };

    setCards((prev) => [...prev, card]);
    setNewCard({
      russian: '',
      russianExample: '',
      english: '',
      englishExample: '',
      category: 'animals',
    });
    toast.success('Карточка добавлена!');
  };

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.russian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.english.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || card.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = {
    animals: cards.filter((c) => c.category === 'animals').length,
    food: cards.filter((c) => c.category === 'food').length,
    travel: cards.filter((c) => c.category === 'travel').length,
    work: cards.filter((c) => c.category === 'work').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
            English Cards
          </h1>
          <p className="text-gray-600 text-lg">Учи английский с удовольствием</p>
        </header>

        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-auto">
            <TabsTrigger value="cards" className="gap-2 py-3">
              <Icon name="CreditCard" size={18} />
              Карточки
            </TabsTrigger>
            <TabsTrigger value="dictionary" className="gap-2 py-3">
              <Icon name="Book" size={18} />
              Словарь
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2 py-3">
              <Icon name="TrendingUp" size={18} />
              Прогресс
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 py-3">
              <Icon name="Layers" size={18} />
              Категории
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-6 animate-scale-in">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Карточка {currentCardIndex + 1} из {cards.length}
              </div>
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
                      <Label>Русское слово</Label>
                      <Input
                        value={newCard.russian}
                        onChange={(e) =>
                          setNewCard({ ...newCard, russian: e.target.value })
                        }
                        placeholder="Кот"
                      />
                    </div>
                    <div>
                      <Label>Пример произношения (рус)</Label>
                      <Input
                        value={newCard.russianExample}
                        onChange={(e) =>
                          setNewCard({ ...newCard, russianExample: e.target.value })
                        }
                        placeholder="У меня есть кот"
                      />
                    </div>
                    <div>
                      <Label>Английское слово</Label>
                      <Input
                        value={newCard.english}
                        onChange={(e) =>
                          setNewCard({ ...newCard, english: e.target.value })
                        }
                        placeholder="Cat"
                      />
                    </div>
                    <div>
                      <Label>Пример произношения (англ)</Label>
                      <Input
                        value={newCard.englishExample}
                        onChange={(e) =>
                          setNewCard({ ...newCard, englishExample: e.target.value })
                        }
                        placeholder="I have a cat"
                      />
                    </div>
                    <div>
                      <Label>Категория</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <Button
                            key={key}
                            variant={newCard.category === key ? 'default' : 'outline'}
                            onClick={() =>
                              setNewCard({
                                ...newCard,
                                category: key as WordCard['category'],
                              })
                            }
                            className="w-full"
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddCard} className="w-full">
                      Добавить
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="perspective-1000 max-w-2xl mx-auto">
              <div
                className={`relative w-full h-96 cursor-pointer transition-transform duration-600 transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                onClick={handleFlip}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.6s',
                }}
              >
                <Card
                  className={`absolute w-full h-full ${
                    categoryColors[currentCard.category]
                  } text-white shadow-2xl backface-hidden hover:shadow-3xl transition-shadow`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-8">
                    <Badge className="mb-4 bg-white/20 backdrop-blur-sm">
                      {categoryLabels[currentCard.category]}
                    </Badge>
                    <h2 className="text-6xl font-bold mb-4">{currentCard.russian}</h2>
                    <p className="text-xl opacity-90 italic">
                      "{currentCard.russianExample}"
                    </p>
                    <p className="text-sm opacity-70 mt-8">Нажми, чтобы перевернуть</p>
                  </CardContent>
                </Card>

                <Card
                  className={`absolute w-full h-full ${
                    categoryColors[currentCard.category]
                  } text-white shadow-2xl backface-hidden`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-8">
                    <Badge className="mb-4 bg-white/20 backdrop-blur-sm">
                      {categoryLabels[currentCard.category]}
                    </Badge>
                    <h2 className="text-6xl font-bold mb-4">{currentCard.english}</h2>
                    <p className="text-xl opacity-90 italic">
                      "{currentCard.englishExample}"
                    </p>
                    <p className="text-sm opacity-70 mt-8">Нажми, чтобы перевернуть</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                className="gap-2"
              >
                <Icon name="ChevronLeft" size={20} />
                Назад
              </Button>
              <Button
                variant={currentCard.learned ? 'secondary' : 'default'}
                size="lg"
                onClick={handleMarkLearned}
                className="gap-2"
              >
                <Icon name={currentCard.learned ? 'CheckCircle2' : 'Circle'} size={20} />
                {currentCard.learned ? 'Изучено' : 'Изучить'}
              </Button>
              <Button variant="outline" size="lg" onClick={handleNext} className="gap-2">
                Вперёд
                <Icon name="ChevronRight" size={20} />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="dictionary" className="space-y-6 animate-fade-in">
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? 'default' : 'outline'}
                    onClick={() =>
                      setSelectedCategory(selectedCategory === key ? null : key)
                    }
                    size="sm"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card) => (
                <Card
                  key={card.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    const index = cards.findIndex((c) => c.id === card.id);
                    setCurrentCardIndex(index);
                    const cardTab = document.querySelector(
                      '[value="cards"]'
                    ) as HTMLElement;
                    cardTab?.click();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={categoryColors[card.category]}>
                        {categoryLabels[card.category]}
                      </Badge>
                      {card.learned && (
                        <Icon name="CheckCircle2" size={18} className="text-green-500" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-lg font-semibold">{card.russian}</p>
                        <p className="text-sm text-gray-500 italic">
                          {card.russianExample}
                        </p>
                      </div>
                      <div className="border-t pt-2">
                        <p className="text-lg font-semibold">{card.english}</p>
                        <p className="text-sm text-gray-500 italic">
                          {card.englishExample}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6 animate-fade-in">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Общий прогресс</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Изучено слов</span>
                      <span className="text-sm font-semibold">
                        {learnedCount} из {cards.length}
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <p className="text-right text-sm text-gray-500 mt-1">
                      {Math.round(progressPercentage)}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <Card className="bg-purple-50">
                      <CardContent className="p-4 text-center">
                        <Icon
                          name="BookOpen"
                          size={32}
                          className="mx-auto mb-2 text-purple-600"
                        />
                        <p className="text-3xl font-bold text-purple-600">
                          {cards.length}
                        </p>
                        <p className="text-sm text-gray-600">Всего слов</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50">
                      <CardContent className="p-4 text-center">
                        <Icon
                          name="CheckCircle2"
                          size={32}
                          className="mx-auto mb-2 text-green-600"
                        />
                        <p className="text-3xl font-bold text-green-600">
                          {learnedCount}
                        </p>
                        <p className="text-sm text-gray-600">Изучено</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-orange-50">
                      <CardContent className="p-4 text-center">
                        <Icon
                          name="Clock"
                          size={32}
                          className="mx-auto mb-2 text-orange-600"
                        />
                        <p className="text-3xl font-bold text-orange-600">
                          {cards.length - learnedCount}
                        </p>
                        <p className="text-sm text-gray-600">Осталось</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-pink-50">
                      <CardContent className="p-4 text-center">
                        <Icon
                          name="Target"
                          size={32}
                          className="mx-auto mb-2 text-pink-600"
                        />
                        <p className="text-3xl font-bold text-pink-600">
                          {Math.round(progressPercentage)}%
                        </p>
                        <p className="text-sm text-gray-600">Прогресс</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">По категориям</h3>
                <div className="space-y-4">
                  {Object.entries(categoryLabels).map(([key, label]) => {
                    const categoryCards = cards.filter((c) => c.category === key);
                    const learned = categoryCards.filter((c) => c.learned).length;
                    const percentage = categoryCards.length
                      ? (learned / categoryCards.length) * 100
                      : 0;

                    return (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{label}</span>
                          <span className="text-sm text-gray-600">
                            {learned} / {categoryCards.length}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Card
                  key={key}
                  className={`${categoryColors[key as WordCard['category']]} text-white overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer`}
                  onClick={() => {
                    setSelectedCategory(key);
                    const dictTab = document.querySelector(
                      '[value="dictionary"]'
                    ) as HTMLElement;
                    dictTab?.click();
                  }}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-3xl font-bold">{label}</h3>
                      <Badge className="bg-white/20 backdrop-blur-sm text-lg px-3 py-1">
                        {categoryCounts[key as WordCard['category']]}
                      </Badge>
                    </div>
                    <p className="text-white/80 mb-6">
                      {cards.filter((c) => c.category === key && c.learned).length}{' '}
                      изучено
                    </p>
                    <Progress
                      value={
                        (cards.filter((c) => c.category === key && c.learned).length /
                          categoryCounts[key as WordCard['category']]) *
                        100
                      }
                      className="h-2 bg-white/20"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
