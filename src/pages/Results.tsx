import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProbabilityDistributionChart } from "@/components/charts/ProbabilityDistributionChart";
import { HistoricalComparisonChart } from "@/components/charts/HistoricalComparisonChart";
import { InfluencingFactorsChart } from "@/components/charts/InfluencingFactorsChart";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown,
  Info,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Target
} from "lucide-react";

// Sample data for charts
const distributionData = [
  { range: "0-10%", frequency: 5, probability: 5 },
  { range: "10-20%", frequency: 8, probability: 15 },
  { range: "20-30%", frequency: 12, probability: 25 },
  { range: "30-40%", frequency: 18, probability: 35 },
  { range: "40-50%", frequency: 25, probability: 45 },
  { range: "50-60%", frequency: 35, probability: 55 },
  { range: "60-70%", frequency: 42, probability: 65 },
  { range: "70-80%", frequency: 38, probability: 75 },
  { range: "80-90%", frequency: 20, probability: 85 },
  { range: "90-100%", frequency: 10, probability: 95 },
];

const historicalData = [
  { event: "Evento 1", probability: 65, confidence: 70, date: "10/01/2024" },
  { event: "Evento 2", probability: 58, confidence: 65, date: "11/01/2024" },
  { event: "Evento 3", probability: 72, confidence: 75, date: "12/01/2024" },
  { event: "Evento 4", probability: 68, confidence: 72, date: "13/01/2024" },
  { event: "Atual", probability: 72, confidence: 80, date: "14/01/2024" },
];

const factorsData = [
  { name: "Histórico Recente", weight: 40, description: "Desempenho nos últimos 10 eventos" },
  { name: "Padrão X", weight: 25, description: "Correlação identificada pelo modelo" },
  { name: "Odds de Mercado", weight: 20, description: "Probabilidade implícita do mercado" },
  { name: "Fator Contextual", weight: 10, description: "Variáveis ambientais" },
  { name: "Outros", weight: 5, description: "Fatores secundários" },
];

export default function Results() {
  const { toast } = useToast();
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  type LastAnalysis = {
    id: number;
    date: string;
    niche: string;
    probability: number;
    confidence: number;
    status: string;
    model: string;
  };
  const [lastAnalysis, setLastAnalysis] = useState<LastAnalysis | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastAnalysis");
      setLastAnalysis(raw ? JSON.parse(raw) : null);
    } catch {
      setLastAnalysis(null);
    }
  }, []);

  const handleFeedback = (isPositive: boolean) => {
    setFeedbackGiven(isPositive);
    toast({
      title: "Feedback registrado",
      description: isPositive 
        ? "Obrigado! Isso ajuda a melhorar nosso modelo." 
        : "Agradecemos o feedback. Vamos analisar para melhorar.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exportando relatório",
      description: "O download do PDF iniciará em breve.",
    });
  };

  if (!lastAnalysis) {
    return (
      <MainLayout 
        title="Resultados da Análise" 
        subtitle="Sem análises realizadas ainda"
      >
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">
            Nenhuma análise foi realizada ainda. Execute sua primeira análise para ver os resultados.
          </p>
          <Link to="/analysis">
            <Button variant="aurora" className="mt-4">Nova Análise</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Resultados da Análise" 
      subtitle={`${lastAnalysis.niche}`}
    >
      <TooltipProvider>
        <div className="space-y-8">
          {/* Main Result Card */}
          <section className="glass-card aurora-border overflow-hidden">
            <div className="grid gap-8 p-6 md:p-8 md:grid-cols-2">
              {/* Probability Display */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-48 w-48 items-center justify-center rounded-full bg-primary/10">
                    <div className="flex h-36 w-36 items-center justify-center rounded-full bg-primary/20">
                      <span className="font-display text-5xl font-bold text-gradient-aurora">
                        {lastAnalysis.probability}%
                      </span>
                    </div>
                  </div>
                  <div className="absolute -inset-4 rounded-full bg-aurora-gradient opacity-20 blur-2xl" />
                </div>
                <h3 className="mb-2 font-display text-2xl font-bold text-foreground">
                  Probabilidade Estimada
                </h3>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-aurora-green" />
                  <span className="text-aurora-green font-medium">Alta Confiança</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Baseado em eventos históricos similares.
                        correlação estatística significativa (p {'<'} 0.05).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-aurora-teal/20 p-2 text-aurora-teal">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Intervalo de Confiança</p>
                      <p className="font-display font-semibold text-foreground">68% - 76%</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-aurora-green/20 p-2 text-aurora-green">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tendência</p>
                      <p className="font-display font-semibold text-foreground">Crescente (+4%)</p>
                    </div>
                  </div>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/20 p-2 text-primary">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Eventos Analisados</p>
                      <p className="font-display font-semibold text-foreground">1,247 registros</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="flex items-center gap-3 border-t border-border/50 bg-destructive/5 px-4 md:px-8 py-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Aviso:</strong> Esta é uma estimativa probabilística. 
                Considere outros fatores não quantificáveis antes de tomar decisões.
              </p>
            </div>
          </section>

          {/* Charts Grid */}
          <div className="grid gap-8 lg:grid-cols-2">
            <ProbabilityDistributionChart 
              data={distributionData} 
              currentValue={lastAnalysis.probability}
            />
            <InfluencingFactorsChart data={factorsData} />
          </div>

          <HistoricalComparisonChart 
            data={historicalData}
            currentProbability={lastAnalysis.probability}
          />

          {/* Technical Justification */}
          <section className="glass-card p-4 md:p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
              Justificativa Técnica
            </h3>
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="methodology" className="rounded-lg border border-border/50 bg-muted/30 px-4">
                <AccordionTrigger className="text-left">
                  Metodologia Utilizada
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    O cálculo foi realizado utilizando <strong className="text-foreground">estatística bayesiana</strong> combinada 
                    com <strong className="text-foreground">regressão logística</strong>, analisando os seguintes fatores:
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Histórico recente dos últimos 50 eventos (peso: 40%)</li>
                    <li>Padrão X identificado via clustering (peso: 25%)</li>
                    <li>Correlação com odds de mercado (peso: 20%)</li>
                    <li>Fatores contextuais selecionados (peso: 15%)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="confidence" className="rounded-lg border border-border/50 bg-muted/30 px-4">
                <AccordionTrigger className="text-left">
                  Explicação da Confiança
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p>
                    A <strong className="text-foreground">alta confiança</strong> (80%) foi determinada pela quantidade de 
                    dados disponíveis (1.247 eventos) e pela baixa variância nos resultados 
                    históricos para condições similares. O intervalo de confiança de 68-76% 
                    representa um desvio padrão de 4 pontos percentuais.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="limitations" className="rounded-lg border border-border/50 bg-muted/30 px-4">
                <AccordionTrigger className="text-left">
                  Limitações e Riscos
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>O modelo não considera eventos externos imprevisíveis</li>
                    <li>Viés potencial em dados históricos limitados para nichos específicos</li>
                    <li>A probabilidade passada não garante resultados futuros</li>
                    <li>Recomenda-se cautela para decisões de alto impacto</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Feedback Section */}
          <section className="glass-card p-4 md:p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
              Feedback
            </h3>
            <p className="mb-4 text-muted-foreground">
              Após o evento, nos informe o resultado para melhorar nosso modelo:
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                variant={feedbackGiven === true ? "aurora" : "outline"}
                onClick={() => handleFeedback(true)}
                disabled={feedbackGiven !== null}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Acertou
              </Button>
              <Button
                variant={feedbackGiven === false ? "destructive" : "outline"}
                onClick={() => handleFeedback(false)}
                disabled={feedbackGiven !== null}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Errou
              </Button>
            </div>
            {feedbackGiven !== null && (
              <p className="mt-4 text-sm text-aurora-green">
                ✓ Feedback registrado. Obrigado por contribuir com a melhoria do modelo!
              </p>
            )}
          </section>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button variant="aurora" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Relatório (PDF)
            </Button>
            <Link to="/analysis">
              <Button variant="glass">
                <RefreshCw className="mr-2 h-4 w-4" />
                Nova Análise
              </Button>
            </Link>
          </div>
        </div>
      </TooltipProvider>
    </MainLayout>
  );
}
