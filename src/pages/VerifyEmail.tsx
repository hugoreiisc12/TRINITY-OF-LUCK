import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MailCheck, Loader2, MailWarning } from "lucide-react";

export default function VerifyEmail() {
  const { toast } = useToast();
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Email não informado",
        description: "Retorne ao cadastro e informe seu email.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      toast({
        title: "Confirmação reenviada",
        description: "Verifique sua caixa de entrada e pasta de spam.",
      });
    } catch (err) {
      toast({
        title: "Erro ao reenviar",
        description: err instanceof Error ? err.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aurora-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card aurora-border w-full max-w-lg p-6 md:p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <MailWarning className="h-8 w-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
          Verifique seu email
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enviamos um link de confirmação {email ? `para ${email}` : "para o seu email"}.
          Confirme o cadastro para liberar o acesso ao site.
        </p>
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground mb-6">
          Dica: Caso não encontre, verifique a pasta de spam ou promoções.
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button 
            variant="aurora" 
            onClick={handleResend}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <MailCheck className="mr-2 h-4 w-4" />
                Reenviar Confirmação
              </>
            )}
          </Button>
          <Link to="/auth">
            <Button variant="glass">
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
