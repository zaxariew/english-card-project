import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { UserAccount, WordCard, Category } from './types';

type ProgressTabProps = {
  isAdmin: boolean;
  accounts: UserAccount[];
  cards: WordCard[];
  categories: Category[];
};

export default function ProgressTab({ isAdmin, accounts, cards, categories }: ProgressTabProps) {
  const learnedCount = cards.filter((c) => c.learned).length;
  const progressPercentage = cards.length ? (learnedCount / cards.length) * 100 : 0;

  if (isAdmin) {
    return (
      <Card className="animate-fade-in">
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
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
    </div>
  );
}
