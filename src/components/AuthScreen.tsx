import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthScreenProps = {
  authMode: 'login' | 'register';
  authForm: { username: string; password: string };
  onAuthFormChange: (form: { username: string; password: string }) => void;
  onSubmit: () => void;
  onToggleMode: () => void;
};

export default function AuthScreen({
  authMode,
  authForm,
  onAuthFormChange,
  onSubmit,
  onToggleMode,
}: AuthScreenProps) {
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
                onChange={(e) => onAuthFormChange({ ...authForm, username: e.target.value })}
                placeholder="username"
              />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input
                type="password"
                value={authForm.password}
                onChange={(e) => onAuthFormChange({ ...authForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={onSubmit} className="w-full">
              {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </Button>
            <Button variant="ghost" onClick={onToggleMode} className="w-full">
              {authMode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
