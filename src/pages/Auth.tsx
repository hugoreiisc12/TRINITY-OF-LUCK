import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Infinity as InfinityIcon, Loader2 } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showContent, setShowContent] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Animation sequence
    const contentTimer = setTimeout(() => setShowContent(true), 1500);
    const loginTimer = setTimeout(() => setShowLogin(true), 3000);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(loginTimer);
    };
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = authSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        const msg = error.message?.toLowerCase() || "";
        if (msg.includes("confirm") || msg.includes("not confirmed")) {
          toast({
            title: "Email não confirmado",
            description: "Verifique seu email para confirmar o cadastro.",
            variant: "destructive",
          });
          navigate(`/verify-email?email=${encodeURIComponent(validated.email)}`);
        } else if (error.message === "Invalid login credentials") {
          toast({
            title: "Usuário não cadastrado",
            description: "Email ou senha incorretos. Se não tem conta, cadastre-se.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aurora-bg min-h-screen flex flex-col items-center justify-center p-4">
      {/* Infinity Loader */}
      <div className="relative mb-12">
        <InfinityIcon 
          className="h-24 w-24 text-primary animate-infinity" 
          strokeWidth={1.5}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 blur-xl animate-pulse" />
        </div>
      </div>

      {/* Welcome Text */}
      <h1 
        className={`font-display text-4xl md:text-5xl font-bold text-center mb-4 transition-all duration-1000 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="text-gradient-aurora">Bem-vindos ao</span>
      </h1>
      <h2 
        className={`font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-12 transition-all duration-1000 delay-300 ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        Trinity of Luck
      </h2>

      {/* Login Form */}
      <div 
        className={`glass-card aurora-border w-full max-w-md p-6 md:p-8 transition-all duration-700 ${
          showLogin ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <h3 className="font-display text-xl font-semibold text-foreground text-center mb-6">
          Entrar na sua conta
        </h3>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            variant="aurora" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
          
          <div className="text-center mt-4">
            <span className="text-muted-foreground text-sm">Não tem uma conta? </span>
            <Button 
              variant="link" 
              className="p-0 text-primary hover:text-primary/80"
              onClick={() => navigate("/register")}
            >
              Cadastre-se
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
