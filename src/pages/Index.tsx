import { useState, useEffect } from 'react';
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

const API_URLS = {
  auth: 'https://functions.poehali.dev/d31f6748-ce3c-44a4-abfa-4271917daac9',
  categories: 'https://functions.poehali.dev/30beca39-899a-4ba5-9f24-b4faa5bcf740',
  cards: 'https://functions.poehali.dev/98633d20-1c13-4175-9b6c-e7cbed102a76',
  translate: 'https://functions.poehali.dev/671e36e0-fbd9-46ff-a494-a599c851fdd8',
  accounts: 'https://functions.poehali.dev/5c9631a9-7bf7-47d0-a949-aaacd6de409f',
};

type UserAccount = {
  id: number;
  username: string;
  createdAt: string;
  cardsLearned: number;
  totalCards: number;
  progress: number;
};

type WordCard = {
  id: number;
  russian: string;
  russianExample: string;
  english: string;
  englishExample: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  learned: boolean;
};

type Category = {
  id: number;
  name: string;
  color: string;
};

type Group = {
  id: number;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  cardCount: number;
};

export default function Index() {
  const [user, setUser] = useState<{ id: number; username: string; isAdmin: boolean } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<WordCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  const [newCard, setNewCard] = useState({
    russian: '',
    russianExample: '',
    english: '',
    englishExample: '',
    categoryId: 0,
  });
  
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingCard, setEditingCard] = useState<WordCard | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    color: 'bg-gradient-to-br from-gray-500 to-gray-600',
  });
  
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedCardsForGroup, setSelectedCardsForGroup] = useState<number[]>([]);

  const currentCard = cards[currentCardIndex];
  const learnedCount = cards.filter((c) => c.learned).length;
  const progressPercentage = cards.length ? (learnedCount / cards.length) * 100 : 0;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
    } else {
      setShowAuth(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        loadAccounts();
      }
      loadCategories(user.id);
      loadCards(user.id, null);
      loadGroups();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && selectedGroupId !== null) {
      loadCards(user.id, selectedGroupId);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (categories.length > 0 && newCard.categoryId === 0) {
      setNewCard((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories.length]);

  const speak = (text: string, lang: 'ru-RU' | 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentCard && !isFlipped) {
      speak(currentCard.russian, 'ru-RU');
    } else if (currentCard && isFlipped) {
      speak(currentCard.english, 'en-US');
    }
  }, [currentCardIndex, isFlipped]);

  const playSound = (text: string, lang: 'ru-RU' | 'en-US') => {
    speak(text, lang);
  };

  const handleAuth = async () => {
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          username: authForm.username,
          password: authForm.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = { id: data.userId, username: data.username, isAdmin: data.isAdmin || false };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setShowAuth(false);
        toast.success(authMode === 'login' ? 'Вход выполнен!' : 'Регистрация успешна!');
        if (userData.isAdmin) {
          loadAccounts();
        }
        loadCategories(data.userId);
        loadCards(data.userId);
      } else {
        toast.error(data.error || 'Ошибка авторизации');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCards([]);
    setCategories([]);
    setShowAuth(true);
    toast.success('Выход выполнен');
  };

  const loadCategories = async (userId: number) => {
    try {
      const response = await fetch(API_URLS.categories, {
        headers: { 
          'X-User-Id': userId.toString(),
          'X-Is-Admin': user?.isAdmin ? 'true' : 'false'
        },
      });
      const data = await response.json();
      setCategories(data.categories || []);
      if (data.categories?.length > 0) {
        setNewCard((prev) => ({ ...prev, categoryId: data.categories[0].id }));
      }
    } catch (error) {
      toast.error('Ошибка загрузки категорий');
    }
  };

  const loadCards = async (userId: number, groupIdFilter?: number | null) => {
    try {
      const url = groupIdFilter 
        ? `${API_URLS.cards}?groupId=${groupIdFilter}`
        : API_URLS.cards;
      
      const response = await fetch(url, {
        headers: { 
          'X-User-Id': userId.toString(),
          'X-Is-Admin': user?.isAdmin ? 'true' : 'false'
        },
      });
      const data = await response.json();
      setCards(data.cards || []);
    } catch (error) {
      toast.error('Ошибка загрузки карточек');
    }
  };

  const loadAccounts = async () => {
    if (!user?.isAdmin) return;
    
    try {
      const response = await fetch(API_URLS.accounts, {
        headers: {
          'X-Is-Admin': 'true'
        },
      });
      const data = await response.json();
      setAccounts(data.users || []);
    } catch (error) {
      console.error('Ошибка загрузки аккаунтов:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!user || !newCategory.name) {
      toast.error('Введите название категории');
      return;
    }

    try {
      const response = await fetch(API_URLS.categories, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': user.isAdmin ? 'true' : 'false',
        },
        body: JSON.stringify(newCategory),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Категория добавлена!');
        loadCategories(user.id);
        setNewCategory({ name: '', color: 'bg-gradient-to-br from-gray-500 to-gray-600' });
      } else {
        toast.error(data.error || 'Ошибка добавления категории');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

  const handleTranslate = async () => {
    if (!newCard.russian.trim()) {
      toast.error('Введите русское слово');
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch(API_URLS.translate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ russian: newCard.russian }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewCard({
          ...newCard,
          english: data.english,
          russianExample: data.russianExample,
          englishExample: data.englishExample,
        });
        toast.success('Перевод готов!');
      } else {
        toast.error(data.error || 'Ошибка перевода');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAddCard = async () => {
    if (!user || !newCard.russian || !newCard.english) {
      toast.error('Заполните русское и английское слово');
      return;
    }



    try {
      const response = await fetch(API_URLS.cards, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': user.isAdmin ? 'true' : 'false',
        },
        body: JSON.stringify(newCard),
      });

      if (response.ok) {
        toast.success('Карточка добавлена!');
        loadCards(user.id);
        setNewCard({
          russian: '',
          russianExample: '',
          english: '',
          englishExample: '',
          categoryId: categories[0]?.id || 0,
        });
      } else {
        toast.error('Ошибка добавления карточки');
      }
    } catch (error) {
      toast.error('Ошибка соединения');
    }
  };

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

  const handleEditCard = async () => {
    if (!user || !editingCard) return;

    try {
      const response = await fetch(API_URLS.cards, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': user.isAdmin ? 'true' : 'false',
        },
        body: JSON.stringify({
          cardId: editingCard.id,
          ...editingCard,
        }),
      });

      if (response.ok) {
        toast.success('Карточка обновлена!');
        setEditDialogOpen(false);
        setEditingCard(null);
        loadCards(user.id);
      } else {
        toast.error('Ошибка при обновлении');
      }
    } catch (error) {
      toast.error('Не удалось обновить карточку');
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!user || !confirm('Удалить эту карточку?')) return;

    try {
      const response = await fetch(API_URLS.cards, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': user.isAdmin ? 'true' : 'false',
        },
        body: JSON.stringify({ cardId }),
      });

      if (response.ok) {
        toast.success('Карточка удалена');
        loadCards(user.id);
        if (currentCardIndex >= cards.length - 1) {
          setCurrentCardIndex(Math.max(0, cards.length - 2));
        }
      } else {
        toast.error('Ошибка при удалении');
      }
    } catch (error) {
      toast.error('Не удалось удалить карточку');
    }
  };

  const handleMarkLearned = async () => {
    if (!user || !currentCard) return;

    try {
      await fetch(API_URLS.cards, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': user.isAdmin ? 'true' : 'false',
        },
        body: JSON.stringify({
          id: currentCard.id,
          learned: !currentCard.learned,
        }),
      });

      setCards((prev) =>
        prev.map((card) =>
          card.id === currentCard.id ? { ...card, learned: !card.learned } : card
        )
      );

      toast.success(
        currentCard.learned ? 'Карточка отмечена как не изученная' : 'Отлично! Слово изучено'
      );
    } catch (error) {
      toast.error('Ошибка обновления');
    }
  };

  const loadGroups = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_URLS.cards}?resource=groups`, {
        headers: { 
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': user.isAdmin ? 'true' : 'false'
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Failed to load groups');
    }
  };

  const handleAddGroup = async () => {
    if (!user || !newGroup.name.trim()) return;
    try {
      const response = await fetch(API_URLS.cards, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': 'true',
        },
        body: JSON.stringify(newGroup),
      });
      if (response.ok) {
        toast.success('Группа создана!');
        setNewGroup({ name: '', description: '', color: '#3b82f6' });
        loadGroups();
      }
    } catch (error) {
      toast.error('Ошибка создания группы');
    }
  };

  const handleAddCardsToGroup = async (groupId: number) => {
    if (!user || selectedCardsForGroup.length === 0) return;
    try {
      const response = await fetch(API_URLS.cards, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': 'true',
        },
        body: JSON.stringify({
          groupId,
          cardIds: selectedCardsForGroup,
        }),
      });
      if (response.ok) {
        toast.success('Карточки добавлены в группу!');
        setSelectedCardsForGroup([]);
        loadGroups();
      }
    } catch (error) {
      toast.error('Ошибка добавления карточек');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!user || !confirm('Удалить эту группу?')) return;
    try {
      const response = await fetch(`${API_URLS.cards}?groupId=${groupId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': user.id.toString(),
          'X-Is-Admin': 'true',
        },
      });
      if (response.ok) {
        toast.success('Группа удалена');
        loadGroups();
      }
    } catch (error) {
      toast.error('Ошибка удаления группы');
    }
  };

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.russian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.english.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategoryId || card.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const colorOptions = [
    { name: 'Фиолетовый', value: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { name: 'Розовый', value: 'bg-gradient-to-br from-pink-500 to-pink-600' },
    { name: 'Оранжевый', value: 'bg-gradient-to-br from-orange-500 to-orange-600' },
    { name: 'Синий', value: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { name: 'Зелёный', value: 'bg-gradient-to-br from-green-500 to-green-600' },
    { name: 'Красный', value: 'bg-gradient-to-br from-red-500 to-red-600' },
    { name: 'Жёлтый', value: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
    { name: 'Серый', value: 'bg-gradient-to-br from-gray-500 to-gray-600' },
  ];

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-scale-in">
          <CardContent className="p-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-2 text-center">
              English Cards
            </h1>
            <p className="text-gray-600 text-center mb-8">Учи английский с удовольствием</p>

            <div className="space-y-4">
              <div>
                <Label>Имя пользователя</Label>
                <Input
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  placeholder="username"
                />
              </div>
              <div>
                <Label>Пароль</Label>
                <Input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <Button onClick={handleAuth} className="w-full">
                {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="w-full"
              >
                {authMode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentCard && !user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                English Cards
              </h1>
              <p className="text-gray-600">Привет, {user?.username}!</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <Icon name="LogOut" size={18} className="mr-2" />
              Выйти
            </Button>
          </header>

          <Card className="text-center p-12">
            <CardContent>
              <Icon name="BookOpen" size={64} className="mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-4">Нет карточек</h2>
              <p className="text-gray-600 mb-6">Добавь свою первую карточку для изучения английского!</p>
              {user?.isAdmin && (
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
                        onChange={(e) => setNewCard({ ...newCard, russian: e.target.value })}
                        placeholder="Кот"
                      />
                    </div>
                    <div>
                      <Label>Пример (рус)</Label>
                      <Input
                        value={newCard.russianExample}
                        onChange={(e) => setNewCard({ ...newCard, russianExample: e.target.value })}
                        placeholder="У меня есть кот"
                      />
                    </div>
                    <div>
                      <Label>Английское слово</Label>
                      <Input
                        value={newCard.english}
                        onChange={(e) => setNewCard({ ...newCard, english: e.target.value })}
                        placeholder="Cat"
                      />
                    </div>
                    <div>
                      <Label>Пример (англ)</Label>
                      <Input
                        value={newCard.englishExample}
                        onChange={(e) => setNewCard({ ...newCard, englishExample: e.target.value })}
                        placeholder="I have a cat"
                      />
                    </div>
                    <div>
                      <Label>Категория (необязательно)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          variant={!newCard.categoryId || newCard.categoryId === 0 ? 'default' : 'outline'}
                          onClick={() => setNewCard({ ...newCard, categoryId: 0 })}
                          className="w-full"
                        >
                          Без категории
                        </Button>
                        {categories.map((cat) => (
                          <Button
                            key={cat.id}
                            variant={newCard.categoryId === cat.id ? 'default' : 'outline'}
                            onClick={() => setNewCard({ ...newCard, categoryId: cat.id })}
                            className="w-full"
                          >
                            {cat.name}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              English Cards
            </h1>
            <p className="text-gray-600">Привет, {user?.username}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </header>

        <Tabs defaultValue={user?.isAdmin ? "dictionary" : "cards"} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-auto">
            {user?.isAdmin ? (
              <>
                <TabsTrigger value="dictionary" className="gap-2 py-3">
                  <Icon name="Book" size={18} />
                  Библиотека
                </TabsTrigger>
                <TabsTrigger value="progress" className="gap-2 py-3">
                  <Icon name="Users" size={18} />
                  Аккаунты
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-2 py-3">
                  <Icon name="Layers" size={18} />
                  Категории
                </TabsTrigger>
                <TabsTrigger value="groups" className="gap-2 py-3">
                  <Icon name="UsersRound" size={18} />
                  Группы
                </TabsTrigger>
              </>
            ) : (
              <>
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
              </>
            )}
          </TabsList>

          {!user?.isAdmin && (
          <TabsContent value="cards" className="space-y-6 animate-scale-in">
            {groups.length > 0 && (
              <div className="flex gap-2 items-center mb-4">
                <Label className="text-sm font-medium">Группа:</Label>
                <select
                  value={selectedGroupId || ''}
                  onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : null)}
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
              <div className="text-sm text-gray-500">
                Карточка {currentCardIndex + 1} из {cards.length}
              </div>
              {user?.isAdmin && (
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
                          onClick={handleTranslate}
                          disabled={isTranslating || !newCard.russian.trim()}
                          className="gap-2"
                        >
                          <Icon name={isTranslating ? 'Loader2' : 'Sparkles'} size={16} className={isTranslating ? 'animate-spin' : ''} />
                          {isTranslating ? 'Перевожу...' : 'AI'}
                        </Button>
                      </div>
                      <Input
                        value={newCard.russian}
                        onChange={(e) => setNewCard({ ...newCard, russian: e.target.value })}
                        placeholder="Кот"
                      />
                    </div>
                    <div>
                      <Label>Пример (рус)</Label>
                      <Input
                        value={newCard.russianExample}
                        onChange={(e) => setNewCard({ ...newCard, russianExample: e.target.value })}
                        placeholder="У меня есть кот"
                      />
                    </div>
                    <div>
                      <Label>Английское слово</Label>
                      <Input
                        value={newCard.english}
                        onChange={(e) => setNewCard({ ...newCard, english: e.target.value })}
                        placeholder="Cat"
                      />
                    </div>
                    <div>
                      <Label>Пример (англ)</Label>
                      <Input
                        value={newCard.englishExample}
                        onChange={(e) => setNewCard({ ...newCard, englishExample: e.target.value })}
                        placeholder="I have a cat"
                      />
                    </div>
                    <div>
                      <Label>Категория (необязательно)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          variant={!newCard.categoryId || newCard.categoryId === 0 ? 'default' : 'outline'}
                          onClick={() => setNewCard({ ...newCard, categoryId: 0 })}
                          className="w-full"
                        >
                          Без категории
                        </Button>
                        {categories.map((cat) => (
                          <Button
                            key={cat.id}
                            variant={newCard.categoryId === cat.id ? 'default' : 'outline'}
                            onClick={() => setNewCard({ ...newCard, categoryId: cat.id })}
                            className="w-full"
                          >
                            {cat.name}
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
              )}
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
                  className={`absolute w-full h-full ${currentCard.categoryColor || 'bg-gradient-to-br from-purple-500 to-purple-600'} text-white shadow-2xl backface-hidden hover:shadow-3xl transition-shadow`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-8">
                    <Badge className="mb-4 bg-white/20 backdrop-blur-sm">
                      {currentCard.categoryName || 'Без категории'}
                    </Badge>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-6xl font-bold">{currentCard.russian}</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound(currentCard.russian, 'ru-RU');
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
                          playSound(currentCard.russianExample, 'ru-RU');
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
                          playSound(currentCard.english, 'en-US');
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
                          playSound(currentCard.englishExample, 'en-US');
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
              <Button variant="outline" size="lg" onClick={handlePrevious} className="gap-2">
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
          )}

          <TabsContent value="dictionary" className="space-y-6 animate-fade-in">
            {user?.isAdmin && (
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
                          onClick={handleTranslate}
                          disabled={isTranslating || !newCard.russian.trim()}
                          className="gap-2"
                        >
                          <Icon name={isTranslating ? 'Loader2' : 'Sparkles'} size={16} className={isTranslating ? 'animate-spin' : ''} />
                          {isTranslating ? 'Перевожу...' : 'AI'}
                        </Button>
                      </div>
                      <Input
                        value={newCard.russian}
                        onChange={(e) => setNewCard({ ...newCard, russian: e.target.value })}
                        placeholder="Кот"
                      />
                    </div>
                    <div>
                      <Label>Пример (рус)</Label>
                      <Input
                        value={newCard.russianExample}
                        onChange={(e) => setNewCard({ ...newCard, russianExample: e.target.value })}
                        placeholder="У меня есть кот"
                      />
                    </div>
                    <div>
                      <Label>Английское слово</Label>
                      <Input
                        value={newCard.english}
                        onChange={(e) => setNewCard({ ...newCard, english: e.target.value })}
                        placeholder="Cat"
                      />
                    </div>
                    <div>
                      <Label>Пример (англ)</Label>
                      <Input
                        value={newCard.englishExample}
                        onChange={(e) => setNewCard({ ...newCard, englishExample: e.target.value })}
                        placeholder="I have a cat"
                      />
                    </div>
                    <div>
                      <Label>Категория (необязательно)</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          variant={!newCard.categoryId || newCard.categoryId === 0 ? 'default' : 'outline'}
                          onClick={() => setNewCard({ ...newCard, categoryId: 0 })}
                          className="w-full"
                        >
                          Без категории
                        </Button>
                        {categories.map((cat) => (
                          <Button
                            key={cat.id}
                            variant={newCard.categoryId === cat.id ? 'default' : 'outline'}
                            onClick={() => setNewCard({ ...newCard, categoryId: cat.id })}
                            className="w-full"
                          >
                            {cat.name}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategoryId === null ? 'default' : 'outline'}
                  onClick={() => setSelectedCategoryId(null)}
                  size="sm"
                >
                  Все
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategoryId(cat.id)}
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
                  onClick={() => {
                    const index = cards.findIndex((c) => c.id === card.id);
                    setCurrentCardIndex(index);
                    const cardTab = document.querySelector('[value="cards"]') as HTMLElement;
                    cardTab?.click();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className={card.categoryColor || 'bg-gray-500'}>{card.categoryName || 'Без категории'}</Badge>
                      <div className="flex gap-1">
                        {user?.isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCard(card);
                                setEditDialogOpen(true);
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
                                handleDeleteCard(card.id);
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
          </TabsContent>

          <TabsContent value="progress" className="space-y-6 animate-fade-in">
            {user?.isAdmin ? (
              <Card>
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Аккаунты пользователей</h3>
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <Card key={account.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Icon name="User" size={24} className="text-purple-600" />
                                <div>
                                  <h4 className="font-semibold text-lg">{account.username}</h4>
                                  <p className="text-xs text-gray-500">
                                    Зарегистрирован: {new Date(account.createdAt).toLocaleDateString('ru-RU')}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Прогресс обучения</span>
                                  <span className="font-semibold">
                                    {account.cardsLearned} / {account.totalCards} карточек
                                  </span>
                                </div>
                                <Progress value={account.progress} className="h-2" />
                                <p className="text-xs text-right text-gray-500">{account.progress}%</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {accounts.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Пока нет зарегистрированных пользователей</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
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
                        <Icon name="BookOpen" size={32} className="mx-auto mb-2 text-purple-600" />
                        <p className="text-3xl font-bold text-purple-600">{cards.length}</p>
                        <p className="text-sm text-gray-600">Всего слов</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50">
                      <CardContent className="p-4 text-center">
                        <Icon name="CheckCircle2" size={32} className="mx-auto mb-2 text-green-600" />
                        <p className="text-3xl font-bold text-green-600">{learnedCount}</p>
                        <p className="text-sm text-gray-600">Изучено</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-orange-50">
                      <CardContent className="p-4 text-center">
                        <Icon name="Clock" size={32} className="mx-auto mb-2 text-orange-600" />
                        <p className="text-3xl font-bold text-orange-600">
                          {cards.length - learnedCount}
                        </p>
                        <p className="text-sm text-gray-600">Осталось</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-pink-50">
                      <CardContent className="p-4 text-center">
                        <Icon name="Target" size={32} className="mx-auto mb-2 text-pink-600" />
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
                  {categories.map((cat) => {
                    const categoryCards = cards.filter((c) => c.categoryId === cat.id);
                    const learned = categoryCards.filter((c) => c.learned).length;
                    const percentage = categoryCards.length ? (learned / categoryCards.length) * 100 : 0;

                    return (
                      <div key={cat.id}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{cat.name}</span>
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
              </>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6 animate-fade-in">
            <div className="flex justify-end mb-4">
              {user?.isAdmin && (
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
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
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
                            onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                            className="w-full"
                          >
                            <div className={`w-4 h-4 rounded mr-2 ${color.value}`}></div>
                            {color.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddCategory} className="w-full">
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
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      const dictTab = document.querySelector('[value="dictionary"]') as HTMLElement;
                      dictTab?.click();
                    }}
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
          </TabsContent>

          <TabsContent value="groups" className="space-y-6 animate-fade-in">
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
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="Например: Базовый уровень"
                    />
                  </div>
                  <div>
                    <Label>Описание (опционально)</Label>
                    <Input
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="Описание группы"
                    />
                  </div>
                  <div>
                    <Label>Цвет группы</Label>
                    <Input
                      type="color"
                      value={newGroup.color}
                      onChange={(e) => setNewGroup({ ...newGroup, color: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddGroup} className="w-full">
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
                      </div>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {group.cardCount} карт.
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedGroupId(group.id)}
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
                            {cards.map((card) => (
                              <div
                                key={card.id}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  setSelectedCardsForGroup((prev) =>
                                    prev.includes(card.id)
                                      ? prev.filter((id) => id !== card.id)
                                      : [...prev, card.id]
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
                              handleAddCardsToGroup(group.id);
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
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
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
                  onChange={(e) => setEditingCard({ ...editingCard, russian: e.target.value })}
                />
              </div>
              <div>
                <Label>Пример (рус)</Label>
                <Input
                  value={editingCard.russianExample}
                  onChange={(e) => setEditingCard({ ...editingCard, russianExample: e.target.value })}
                />
              </div>
              <div>
                <Label>Английское слово</Label>
                <Input
                  value={editingCard.english}
                  onChange={(e) => setEditingCard({ ...editingCard, english: e.target.value })}
                />
              </div>
              <div>
                <Label>Пример (англ)</Label>
                <Input
                  value={editingCard.englishExample}
                  onChange={(e) => setEditingCard({ ...editingCard, englishExample: e.target.value })}
                />
              </div>
              <div>
                <Label>Категория</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={editingCard.categoryId === cat.id ? 'default' : 'outline'}
                      onClick={() => setEditingCard({ ...editingCard, categoryId: cat.id })}
                      className="w-full"
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditCard} className="flex-1">Сохранить</Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">Отмена</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}