import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
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
    description: "Entenda cada decisão com justificativas claras baseadas em estatística bayesiana e machine learning.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Sem Decisões Automáticas",
    description: "O sistema fornece probabilidades e insights - você mantém o controle total das decisões.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Aprendizado Contínuo",
    description: "O modelo melhora com seus feedbacks, aumentando a precisão ao longo do tempo.",
  },
];

export default function Index() {
  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Bem-vindo ao Trinity of Luck"
    >
      {/* Hero Section */}
      <section className="mb-12 fade-in">
        <div className="glass-card aurora-border overflow-hidden p-8 md:p-12">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Análise Probabilística Inteligente
            </div>
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Bem-vindo ao{" "}
              <span className="text-gradient-aurora">Trinity of Luck</span>
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Calcule probabilidades baseadas em dados históricos com IA explicativa. 
              Tome decisões informadas com transparência total sobre cada análise.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/analysis">
                <Button variant="aurora" size="xl">
                  Fazer Upload de Dados
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="glass" size="xl">
                  Ver Histórico
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Decorative element */}
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-20">
            <div className="absolute right-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-aurora-gradient blur-3xl" />
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="mb-12 fade-in" style={{ animationDelay: '0.2s' }}>
        <h3 className="mb-6 font-display text-xl font-semibold text-foreground">
          Visão Geral
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.title}
              {...metric}
              delay={index * 100}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-12 fade-in" style={{ animationDelay: '0.4s' }}>
        <h3 className="mb-6 font-display text-xl font-semibold text-foreground">
          Como Funciona
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass-card group p-6 transition-all duration-500 hover:scale-[1.02] opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 150 + 300}ms` }}
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--aurora-cyan)/0.3)]">
                {feature.icon}
              </div>
              <h4 className="mb-2 font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="glass-card aurora-border flex flex-col items-center justify-center p-8 text-center md:p-12">
          <div className="mb-6 rounded-full bg-primary/20 p-4">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-3 font-display text-2xl font-bold text-foreground">
            Pronto para Começar?
          </h3>
          <p className="mb-6 max-w-md text-muted-foreground">
            Faça upload dos seus dados e obtenha análises probabilísticas 
            detalhadas em minutos.
          </p>
          <Link to="/analysis">
            <Button variant="aurora" size="lg">
              Iniciar Nova Análise
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
