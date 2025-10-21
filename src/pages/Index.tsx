import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { API_URLS, WordCard, Category, Group, UserAccount } from '@/components/types';
import AuthScreen from '@/components/AuthScreen';
import EmptyState from '@/components/EmptyState';
import CardViewer from '@/components/CardViewer';
import Dictionary from '@/components/Dictionary';
import ProgressTab from '@/components/ProgressTab';
import CategoriesTab from '@/components/CategoriesTab';
import GroupsTab from '@/components/GroupsTab';
import EditCardDialog from '@/components/EditCardDialog';

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
  const [allCards, setAllCards] = useState<WordCard[]>([]);
  const [cardsSortBy, setCardsSortBy] = useState<'russian' | 'english' | 'category'>('russian');
  const [addCardsDialogOpen, setAddCardsDialogOpen] = useState(false);
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');

  const currentCard = cards[currentCardIndex];

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
        loadCategories(data.userId, userData.isAdmin);
        loadCards(data.userId, null, userData.isAdmin);
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

  const loadCategories = async (userId: number, isAdmin?: boolean) => {
    try {
      const response = await fetch(API_URLS.categories, {
        headers: {
          'X-User-Id': userId.toString(),
          'X-Is-Admin': (isAdmin ?? user?.isAdmin) ? 'true' : 'false'
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

  const loadCards = async (userId: number, groupIdFilter?: number | null, isAdmin?: boolean) => {
    try {
      const url = groupIdFilter
        ? `${API_URLS.cards}?groupId=${groupIdFilter}`
        : API_URLS.cards;

      const response = await fetch(url, {
        headers: {
          'X-User-Id': userId.toString(),
          'X-Is-Admin': (isAdmin ?? user?.isAdmin) ? 'true' : 'false'
        },
      });
      const data = await response.json();
      setCards(data.cards || []);

      if (!groupIdFilter) {
        setAllCards(data.cards || []);
      }
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
        setDialogSearchQuery('');
        setAddCardsDialogOpen(false);
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

  if (showAuth) {
    return (
      <AuthScreen
        authMode={authMode}
        authForm={authForm}
        onAuthFormChange={setAuthForm}
        onSubmit={handleAuth}
        onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
      />
    );
  }

  if (!currentCard && !user?.isAdmin) {
    return (
      <EmptyState
        username={user?.username || ''}
        isAdmin={user?.isAdmin || false}
        categories={categories}
        newCard={newCard}
        onNewCardChange={setNewCard}
        onAddCard={handleAddCard}
        onLogout={handleLogout}
      />
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
            <TabsContent value="cards">
              <CardViewer
                currentCard={currentCard}
                currentCardIndex={currentCardIndex}
                totalCards={cards.length}
                isFlipped={isFlipped}
                isAdmin={user?.isAdmin || false}
                groups={groups}
                selectedGroupId={selectedGroupId}
                categories={categories}
                newCard={newCard}
                isTranslating={isTranslating}
                onFlip={handleFlip}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onMarkLearned={handleMarkLearned}
                onPlaySound={playSound}
                onGroupChange={setSelectedGroupId}
                onNewCardChange={setNewCard}
                onAddCard={handleAddCard}
                onTranslate={handleTranslate}
              />
            </TabsContent>
          )}

          <TabsContent value="dictionary">
            <Dictionary
              cards={cards}
              categories={categories}
              searchQuery={searchQuery}
              selectedCategoryId={selectedCategoryId}
              isAdmin={user?.isAdmin || false}
              newCard={newCard}
              isTranslating={isTranslating}
              onSearchChange={setSearchQuery}
              onCategoryFilter={setSelectedCategoryId}
              onCardClick={(cardId) => {
                const index = cards.findIndex((c) => c.id === cardId);
                setCurrentCardIndex(index);
                const cardTab = document.querySelector('[value="cards"]') as HTMLElement;
                cardTab?.click();
              }}
              onEditCard={(card) => {
                setEditingCard(card);
                setEditDialogOpen(true);
              }}
              onDeleteCard={handleDeleteCard}
              onNewCardChange={setNewCard}
              onAddCard={handleAddCard}
              onTranslate={handleTranslate}
            />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTab
              isAdmin={user?.isAdmin || false}
              accounts={accounts}
              cards={cards}
              categories={categories}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab
              categories={categories}
              cards={cards}
              isAdmin={user?.isAdmin || false}
              newCategory={newCategory}
              onNewCategoryChange={setNewCategory}
              onAddCategory={handleAddCategory}
              onCategoryClick={(categoryId) => {
                setSelectedCategoryId(categoryId);
                const dictTab = document.querySelector('[value="dictionary"]') as HTMLElement;
                dictTab?.click();
              }}
            />
          </TabsContent>

          <TabsContent value="groups">
            <GroupsTab
              groups={groups}
              allCards={allCards}
              newGroup={newGroup}
              selectedGroupId={selectedGroupId}
              selectedCardsForGroup={selectedCardsForGroup}
              addCardsDialogOpen={addCardsDialogOpen}
              dialogSearchQuery={dialogSearchQuery}
              cardsSortBy={cardsSortBy}
              onNewGroupChange={setNewGroup}
              onAddGroup={handleAddGroup}
              onDeleteGroup={handleDeleteGroup}
              onAddCardsDialogOpen={setAddCardsDialogOpen}
              onSelectedGroupIdChange={setSelectedGroupId}
              onSelectedCardsChange={setSelectedCardsForGroup}
              onDialogSearchChange={setDialogSearchQuery}
              onCardsSortByChange={setCardsSortBy}
              onAddCardsToGroup={handleAddCardsToGroup}
            />
          </TabsContent>
        </Tabs>
      </div>

      <EditCardDialog
        open={editDialogOpen}
        editingCard={editingCard}
        categories={categories}
        onOpenChange={setEditDialogOpen}
        onEditingCardChange={setEditingCard}
        onSave={handleEditCard}
      />
    </div>
  );
}