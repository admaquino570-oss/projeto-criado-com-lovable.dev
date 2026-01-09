import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success('Email de recuperação enviado!');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg">
        <div className="text-center">
          <h1 className="font-display text-4xl text-primary">STREAMFLIX</h1>
          <p className="text-muted-foreground mt-2">Recuperar Senha</p>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-foreground">Verifique seu email para o link de recuperação.</p>
            <Link to="/login"><Button variant="outline">Voltar ao Login</Button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Enviar Link'}
            </Button>
            <Link to="/login" className="block text-center text-sm text-primary hover:underline">Voltar ao Login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
