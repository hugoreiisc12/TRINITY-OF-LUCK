import { Link } from "react-router-dom";
import { memo, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";

const metrics = [
  {
    title: "Análises Realizadas",
    value: "1,247",
    subtitle: "Este mês",
    icon: <BarChart3 className="h-6 w-6" />,
    trend: { value: 12, isPositive: true },
  },
  {
    title: "Precisão Média",
    value: "78.5%",
    subtitle: "Últimos 30 dias",
    icon: <Target className="h-6 w-6" />,
    trend: { value: 5.2, isPositive: true },
  },
  {
    title: "Taxa de Sucesso",
    value: "72%",
    subtitle: "Baseado em feedbacks",
    icon: <TrendingUp className="h-6 w-6" />,
    trend: { value: 3.1, isPositive: true },
  },
  {
    title: "Última Análise",
    value: "2h atrás",
    subtitle: "Apostas Esportivas",
    icon: <Clock className="h-6 w-6" />,
  },
];

const features = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "IA Explicativa",
    description: "Entenda cada decisão com justificativas claras baseadas em estatística bayesiana.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Sem Decisões Automáticas",
    description: "Você mantém o controle total das decisões sempre.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Aprendizado Contínuo",
    description: "Precisão melhora com seus feedbacks.",
  },
];

// Memoize components to prevent unnecessary re-renders
const MemoizedMetricCard = memo(MetricCard);

const FeatureCard = memo(({ icon, title, description }: typeof features[0]) => (
  <div className="glass-card p-6 rounded-lg hover:scale-105 transition-transform duration-300">
    <div className="mb-4 text-primary">{icon}</div>
    <h4 className="mb-2 font-semibold text-foreground text-lg">{title}</h4>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
));
FeatureCard.displayName = "FeatureCard";

export default function Index() {
  const { isMobile, shouldReduceAnimations } = useMobileOptimization();

  // Memoize data to prevent recalculation
  const memoizedMetrics = useMemo(() => metrics, []);
  const memoizedFeatures = useMemo(() => features, []);

  // Reduce content on mobile
  const displayMetrics = isMobile ? memoizedMetrics.slice(0, 2) : memoizedMetrics;
  const displayFeatures = isMobile ? memoizedFeatures : memoizedFeatures;

  const getAnimationStyle = (delay: number) => 
    shouldReduceAnimations ? {} : { animationDelay: `${delay}s` };
  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Bem-vindo ao Trinity of Luck"
    >
      {/* Hero Section */}
      <section className={shouldReduceAnimations ? "" : "fade-in mb-12"} style={getAnimationStyle(0.2)}>
        <div className="glass-card aurora-border overflow-hidden p-6 md:p-12">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-xs md:text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              {isMobile ? "Análise IA" : "Análise Probabilística Inteligente"}
            </div>
            <h2 className="mb-4 font-display text-2xl md:text-4xl font-bold text-foreground">
              Bem-vindo ao <span className="text-gradient-aurora">Trinity of Luck</span>
            </h2>
            <p className="mb-8 text-sm md:text-lg text-muted-foreground">
              {isMobile 
                ? "Probabilidades inteligentes com IA" 
                : "Calcule probabilidades com IA explicativa. Decisões informadas com transparência total."
              }
            </p>
            <div className={`flex flex-col md:flex-row gap-3 ${isMobile ? "w-full" : "flex-wrap gap-4"}`}>
              <Link to="/analysis" className={isMobile ? "w-full" : ""}>
                <Button variant="aurora" size={isMobile ? "sm" : "xl"} className={isMobile ? "w-full" : ""}>
                  Upload de Dados
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/history" className={isMobile ? "w-full" : ""}>
                <Button variant="glass" size={isMobile ? "sm" : "xl"} className={isMobile ? "w-full" : ""}>
                  Histórico
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Decorative element - hidden on mobile */}
          {!isMobile && (
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
              <div className="absolute right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-aurora-gradient blur-3xl" />
            </div>
          )}
        </div>
      </section>

      {/* Metrics Grid */}
      <section className={shouldReduceAnimations ? "mb-12" : "mb-12 fade-in"} style={getAnimationStyle(0.3)}>
        <h3 className="mb-6 font-display text-xl font-semibold text-foreground">
          Visão Geral
        </h3>
        <div className={`grid gap-4 md:gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-4"}`}>
          {displayMetrics.map((metric) => (
            <MemoizedMetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className={shouldReduceAnimations ? "mb-12" : "mb-12 fade-in"} style={getAnimationStyle(0.4)}>
        <h3 className="mb-6 font-display text-xl font-semibold text-foreground">
          {isMobile ? "Como Funciona" : "Como Funciona"}
        </h3>
        <div className={`grid gap-4 md:gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-3"}`}>
          {displayFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={shouldReduceAnimations ? "" : "fade-in"} style={getAnimationStyle(0.5)}>
        <div className="glass-card aurora-border flex flex-col items-center justify-center p-6 text-center md:p-12">
          <div className="mb-6 rounded-full bg-primary/20 p-3 md:p-4">
            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <h3 className="mb-3 font-display text-xl md:text-2xl font-bold text-foreground">
            {isMobile ? "Começar Agora?" : "Pronto para Começar?"}
          </h3>
          <p className="mb-6 max-w-md text-sm md:text-base text-muted-foreground">
            Upload de dados e análises em minutos.
          </p>
          <Link to="/analysis">
            <Button variant="aurora" size={isMobile ? "default" : "lg"}>
              Iniciar Análise
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
