import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { FileUpload } from "@/components/analysis/FileUpload";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  AlertTriangle, 
  FileSpreadsheet,
  Settings,
  Brain,
  Loader2,
  ChevronRight,
  Trophy,
  TrendingUp,
  Target
} from "lucide-react";

// Niche configurations with specific variables
const nicheConfigs = {
  sports: {
    label: "Apostas Esportivas",
    icon: Trophy,
    description: "Análise de probabilidades para eventos esportivos",
    variables: [
      { id: "team_form", label: "Forma do Time" },
      { id: "head_to_head", label: "Confrontos Diretos" },
      { id: "home_away", label: "Mando de Campo" },
      { id: "injuries", label: "Lesões/Desfalques" },
      { id: "odds_market", label: "Odds de Mercado" },
      { id: "league_position", label: "Posição na Tabela" },
    ],
    models: [
      { value: "bayesian", label: "Bayesiano" },
      { value: "poisson", label: "Distribuição de Poisson" },
      { value: "regression", label: "Regressão Logística" },
    ],
    placeholder: "Time A vs Time B\nOdds: 1.85\nÚltimos 5 jogos: V V D E V\nGols marcados: 12\nGols sofridos: 5",
  },
  investment: {
    label: "Investimentos",
    icon: TrendingUp,
    description: "Análise de probabilidades para mercado financeiro",
    variables: [
      { id: "volatility", label: "Volatilidade" },
      { id: "market_trend", label: "Tendência de Mercado" },
      { id: "sector_analysis", label: "Análise Setorial" },
      { id: "economic_indicators", label: "Indicadores Econômicos" },
      { id: "volume", label: "Volume de Negociação" },
      { id: "correlation", label: "Correlação com Índices" },
    ],
    models: [
      { value: "montecarlo", label: "Monte Carlo" },
      { value: "regression", label: "Regressão Linear" },
      { value: "arima", label: "ARIMA" },
    ],
    placeholder: "Ativo: PETR4\nPreço atual: R$ 35.50\nVariação 30d: +5.2%\nVolume médio: 25M\nP/L: 8.5",
  },
  general: {
    label: "Análise Geral",
    icon: Target,
    description: "Análise probabilística personalizada",
    variables: [
      { id: "historical", label: "Dados Históricos" },
      { id: "frequency", label: "Frequência de Eventos" },
      { id: "seasonality", label: "Sazonalidade" },
      { id: "external", label: "Fatores Externos" },
    ],
    models: [
      { value: "bayesian", label: "Bayesiano" },
      { value: "regression", label: "Regressão Linear" },
      { value: "ensemble", label: "Ensemble (Combinado)" },
    ],
    placeholder: "Evento: [descrição]\nResultados anteriores: [lista]\nFatores relevantes: [fatores]",
  },
};

type NicheKey = keyof typeof nicheConfigs;

export default function Analysis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [niche, setNiche] = useState<NicheKey | "">("");
  const [model, setModel] = useState("");
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [manualData, setManualData] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentConfig = niche ? nicheConfigs[niche] : null;

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    toast({
      title: "Arquivo carregado",
      description: `${selectedFile.name} foi carregado com sucesso.`,
    });
  };

  const toggleVariable = (variableId: string) => {
    setSelectedVariables(prev => 
      prev.includes(variableId)
        ? prev.filter(id => id !== variableId)
        : [...prev, variableId]
    );
  };

  const handleNicheChange = (value: NicheKey) => {
    setNiche(value);
    setModel("");
    setSelectedVariables([]);
    setManualData("");
  };

  const handleAnalyze = async () => {
    if (!file && !manualData) {
      toast({
        title: "Dados necessários",
        description: "Faça upload de um arquivo ou insira dados manualmente.",
        variant: "destructive",
      });
      return;
    }

    if (!niche || !model) {
      toast({
        title: "Configuração incompleta",
        description: "Selecione o nicho e modelo de análise.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    const steps = [
      { progress: 20, message: "Validando dados..." },
      { progress: 40, message: "Limpando e normalizando..." },
      { progress: 60, message: "Aplicando modelo estatístico..." },
      { progress: 80, message: "Calculando probabilidades..." },
      { progress: 100, message: "Gerando relatório..." },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(step.progress);
    }

    toast({
      title: "Análise concluída",
      description: "Seus resultados estão prontos.",
    });

    setTimeout(() => {
      navigate("/results");
    }, 500);
  };

  return (
    <MainLayout 
      title="Nova Análise" 
      subtitle="Configure e execute sua análise probabilística"
    >
      {/* Step 1: Niche Selection */}
      {!niche ? (
        <section className="fade-in">
          <h3 className="mb-6 font-display text-xl font-semibold text-foreground">
            Selecione o Contexto da Análise
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {(Object.entries(nicheConfigs) as [NicheKey, typeof nicheConfigs.sports][]).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => handleNicheChange(key)}
                  className="glass-card aurora-border group p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--aurora-cyan)/0.2)]"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--aurora-cyan)/0.3)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="mb-2 font-display text-lg font-semibold text-foreground">
                    {config.label}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-primary">
                    <span>Selecionar</span>
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3 fade-in">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Niche indicator */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setNiche("")}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Voltar
              </Button>
              <div className="flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2">
                {currentConfig && <currentConfig.icon className="h-4 w-4 text-primary" />}
                <span className="text-sm font-medium text-primary">
                  {currentConfig?.label}
                </span>
              </div>
            </div>

            {/* File Upload Section */}
            <section className="glass-card p-6 fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Upload de Dados
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Carregue seus dados históricos para análise
                  </p>
                </div>
              </div>
              <FileUpload onFileSelect={handleFileSelect} />
            </section>

            {/* Manual Data Input - Text String */}
            <section className="glass-card p-6 fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                Ou insira dados manualmente
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Descreva seus dados em texto livre. O sistema irá interpretar as informações.
              </p>
              <Textarea
                placeholder={currentConfig?.placeholder}
                value={manualData}
                onChange={(e) => setManualData(e.target.value)}
                className="min-h-[150px] text-sm"
              />
            </section>

            {/* Data Preview */}
            {(file || manualData) && (
              <section className="glass-card p-6 fade-in" style={{ animationDelay: '0.3s' }}>
                <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
                  Preview dos Dados
                </h3>
                {manualData ? (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-foreground">
                      {manualData}
                    </pre>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            #
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Resultado
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Odds
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map((i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="px-4 py-3 text-foreground">{i}</td>
                            <td className="px-4 py-3">
                              <span className={i % 2 === 0 ? "text-aurora-green" : "text-destructive"}>
                                {i % 2 === 0 ? "Sucesso" : "Falha"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {(1.5 + Math.random()).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              2024-01-{10 + i}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar - Configuration */}
          <div className="space-y-6">
            {/* Settings Card */}
            <section className="glass-card p-6 fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <Settings className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Configurações
                </h3>
              </div>

              <div className="space-y-6">
                {/* Model Selection */}
                <div className="space-y-2">
                  <Label>Modelo de Análise</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentConfig?.models.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contextual Variables - Specific to niche */}
                <div className="space-y-3">
                  <Label>Variáveis Contextuais</Label>
                  <div className="space-y-2">
                    {currentConfig?.variables.map((variable) => (
                      <div 
                        key={variable.id}
                        className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                      >
                        <Checkbox
                          id={variable.id}
                          checked={selectedVariables.includes(variable.id)}
                          onCheckedChange={() => toggleVariable(variable.id)}
                        />
                        <Label 
                          htmlFor={variable.id}
                          className="cursor-pointer text-sm"
                        >
                          {variable.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Model Info */}
            <section className="glass-card p-6 fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  Sobre o Modelo
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {model 
                  ? `O modelo ${currentConfig?.models.find(m => m.value === model)?.label} utiliza técnicas estatísticas avançadas para calcular probabilidades baseadas em seus dados históricos.`
                  : "Selecione um modelo para ver mais informações."}
              </p>
            </section>

            {/* Warning */}
            <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-4 fade-in" style={{ animationDelay: '0.3s' }}>
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">
                Forneça dados detalhados para uma análise mais precisa.
              </p>
            </div>

            {/* Progress & Action */}
            {isAnalyzing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Analisando...</span>
                  <span className="font-medium text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processando dados...</span>
                </div>
              </div>
            ) : (
              <Button 
                variant="aurora" 
                size="xl" 
                className="w-full fade-in"
                style={{ animationDelay: '0.4s' }}
                onClick={handleAnalyze}
              >
                <Play className="mr-2 h-5 w-5" />
                Executar Análise
              </Button>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
