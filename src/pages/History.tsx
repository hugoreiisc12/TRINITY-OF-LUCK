import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HistoricalComparisonChart } from "@/components/charts/HistoricalComparisonChart";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";


const learningData = [
  { event: "Jan Sem1", probability: 65, confidence: 70, date: "Semana 1" },
  { event: "Jan Sem2", probability: 68, confidence: 73, date: "Semana 2" },
  { event: "Jan Sem3", probability: 72, confidence: 76, date: "Semana 3" },
  { event: "Jan Sem4", probability: 75, confidence: 80, date: "Semana 4" },
  { event: "Fev Sem1", probability: 78, confidence: 82, date: "Semana 5" },
];

export default function History() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  type HistoryItem = {
    id: number;
    date: string;
    niche: string;
    probability: number;
    confidence: number;
    status: string;
    model: string;
  };
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("analysisHistory");
      setHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setHistory([]);
    }
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.niche.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRetrain = () => {
    toast({
      title: "Re-treinamento iniciado",
      description: "O modelo está sendo atualizado com os novos feedbacks.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exportando histórico",
      description: "O download do arquivo CSV iniciará em breve.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-aurora-green" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return "Acerto";
      case "error":
        return "Erro";
      default:
        return "Pendente";
    }
  };

  return (
    <MainLayout 
      title="Histórico e Aprendizado" 
      subtitle="Acompanhe suas análises e a evolução do modelo"
    >
      <div className="space-y-8">
        {/* Learning Metrics */}
        <section className="grid gap-6 md:grid-cols-3">
          <div className="glass-card aurora-border p-6 opacity-0 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/20 p-2 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precisão Atual</p>
                <p className="font-display text-2xl font-bold text-foreground">78.5%</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-aurora-green">+13.5% desde o início</p>
          </div>

          <div className="glass-card p-6 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-aurora-teal/20 p-2 text-aurora-teal">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo Ativo</p>
                <p className="font-display text-2xl font-bold text-foreground">v1.3</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Atualizado há 2 dias</p>
          </div>

          <div className="glass-card p-6 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-aurora-green/20 p-2 text-aurora-green">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Feedbacks Recebidos</p>
                <p className="font-display text-2xl font-bold text-foreground">847</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Taxa de resposta: 68%</p>
          </div>
        </section>

        {/* Learning Chart */}
        <section>
          <HistoricalComparisonChart 
            data={learningData}
            title="Evolução da Precisão ao Longo do Tempo"
          />
        </section>

        {/* Filters & Actions */}
        <section className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar análises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Acertos</SelectItem>
              <SelectItem value="error">Erros</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="glass" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="aurora" onClick={handleRetrain}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Re-treinar Modelo
          </Button>
        </section>

        {filteredHistory.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground">
              Nenhuma análise no histórico. Execute sua primeira análise para ver o histórico.
            </p>
            <Link to="/analysis">
              <Button variant="aurora" className="mt-4">Nova Análise</Button>
            </Link>
          </div>
        ) : (
          <section className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground md:px-6 md:py-4 whitespace-nowrap">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground md:px-6 md:py-4 whitespace-nowrap">
                      Nicho
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground md:px-6 md:py-4 whitespace-nowrap">
                      Probabilidade
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground md:px-6 md:py-4 whitespace-nowrap">
                      Confiança
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground md:px-6 md:py-4 whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground md:px-6 md:py-4 whitespace-nowrap">
                      Modelo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground md:px-6 md:py-4 whitespace-nowrap">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item, index) => (
                    <tr 
                      key={item.id}
                      className={cn(
                        "border-b border-border/50 transition-colors hover:bg-muted/20",
                        "opacity-0 animate-fade-in"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-3 text-sm text-foreground md:px-6 md:py-4 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground md:px-6 md:py-4 whitespace-nowrap">
                        {item.niche}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap">
                        <span className="font-display font-semibold text-primary">
                          {item.probability}%
                        </span>
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div 
                              className="h-full bg-aurora-gradient"
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {item.confidence}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm text-foreground">
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-sm text-muted-foreground">
                        {item.model}
                      </td>
                      <td className="px-4 py-3 md:px-6 md:py-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="glass-card max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Análise #{item.id}</DialogTitle>
                              <DialogDescription>
                                Realizada em {item.date}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Probabilidade</span>
                                <span className="font-display font-semibold text-primary">
                                  {item.probability}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confiança</span>
                                <span className="font-semibold text-foreground">
                                  {item.confidence}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Modelo</span>
                                <span className="text-foreground">{item.model}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(item.status)}
                                  <span>{getStatusLabel(item.status)}</span>
                                </div>
                              </div>
                            </div>
                            <Link to="/results">
                              <Button variant="aurora" className="w-full">
                                Ver Análise Completa
                              </Button>
                            </Link>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Bias Warning */}
        <section className="flex items-start gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <h4 className="font-medium text-foreground">Alerta de Viés</h4>
            <p className="text-sm text-muted-foreground">
              Detectamos que alguns nichos possuem menos de 100 eventos históricos. 
              Considere adicionar mais dados para melhorar a precisão das análises.
            </p>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
