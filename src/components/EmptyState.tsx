import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';



type EmptyStateProps = {
  username: string;
  isAdmin: boolean;
  newCard: {
    russian: string;
    russianExample: string;
    english: string;
    englishExample: string;
  };
  onNewCardChange: (card: any) => void;
  onAddCard: () => void;
  onLogout: () => void;
};

export default function EmptyState({
  username,
  isAdmin,
  newCard,
  onNewCardChange,
  onAddCard,
  onLogout,
}: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              English Cards
            </h1>
            <p className="text-gray-600">Привет, {username}!</p>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <Icon name="LogOut" size={18} className="mr-2" />
            Выйти
          </Button>
        </header>

        <Card className="text-center p-12">
          <CardContent>
            <Icon name="BookOpen" size={64} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-4">Нет карточек</h2>
            <p className="text-gray-600 mb-6">Добавь свою первую карточку для изучения английского!</p>
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
                      <Label>Русское слово</Label>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}