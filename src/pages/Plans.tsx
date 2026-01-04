import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, CreditCard, Infinity as InfinityIcon } from "lucide-react";

export default function Plans() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubscribe = async (plan: "comum" | "premium" | "trinity") => {
    const credits = plan === "comum" ? 3 : plan === "premium" ? 100 : 1000;
    const data = { ...(user?.user_metadata || {}), plan, credits };
    await supabase.auth.updateUser({ data });
    toast({ title: `Plano ${plan.toUpperCase()} ativado` });
  };

  return (
    <MainLayout title="Planos" subtitle="Escolha o plano ideal para suas análises">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="glass-card aurora-border p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">Comum</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">3 créditos • arquivo ou descrição manual</p>
          <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-aurora-green" /> Upload de arquivo</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-aurora-green" /> Entrada manual</li>
          </ul>
          <Button variant="glass" onClick={() => handleSubscribe("comum")}>Ativar Comum</Button>
        </div>

        <div className="glass-card aurora-border p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">Premium</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">100 créditos/mês • 3 formas de análise</p>
          <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-aurora-green" /> Upload de arquivo</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-aurora-green" /> Entrada manual</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-aurora-green" /> Link externo (apostas comuns)</li>
          </ul>
          <Button variant="aurora" onClick={() => handleSubscribe("premium")}>Ativar Premium</Button>
        </div>

        <div className="glass-card aurora-border p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <InfinityIcon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">TRINITY</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">1000+ créditos • acesso ilimitado</p>
          <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-aurora-green" /> Todas as análises e tipos de apostas</li>
            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-aurora-green" /> Extensão Robo Espião</li>
          </ul>
          <Button variant="aurora" onClick={() => handleSubscribe("trinity")}>Ativar TRINITY</Button>
        </div>
      </div>
    </MainLayout>
  );
}
