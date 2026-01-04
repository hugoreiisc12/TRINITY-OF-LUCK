import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Shield, 
  Settings as SettingsIcon, 
  Eye,
  Save,
  Trash2,
  LogOut,
  Bell,
  Globe,
  Lock,
  Activity
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "João Silva",
    email: "joao.silva@email.com",
  });
  const [notifications, setNotifications] = useState({
    analysisComplete: true,
    modelUpdates: true,
    weeklyReport: false,
  });
  const [privacy, setPrivacy] = useState({
    shareAnonymousData: false,
    encryption: true,
  });
  const [language, setLanguage] = useState("pt-BR");

  const handleSaveProfile = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas.",
    });
  };

  const auditLogs = [
    { date: "14/01/2024 15:32", action: "Login realizado", ip: "192.168.1.1" },
    { date: "14/01/2024 15:35", action: "Análise executada #1247", ip: "192.168.1.1" },
    { date: "13/01/2024 10:15", action: "Configurações alteradas", ip: "192.168.1.1" },
    { date: "12/01/2024 18:45", action: "Arquivo carregado", ip: "192.168.1.1" },
  ];

  const [tab, setTab] = useState("profile");
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const t = params.get("tab");
    if (t) setTab(t);
  }, [params]);

  const handleTabChange = (value: string) => {
    setTab(value);
    const next = new URLSearchParams(params);
    next.set("tab", value);
    setParams(next, { replace: true });
  };

  const bettingPlatforms = [
    { name: "PolyMarket", logo: "https://polymarket.com/favicon.ico" },
    { name: "Bet365", logo: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Bet365_logo.svg" },
    { name: "Betfair", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Betfair_logo.svg" },
    { name: "Betano", logo: "https://upload.wikimedia.org/wikipedia/commons/1/16/Betano_logo.png" },
    { name: "BetNacional", logo: "https://www.betnacional.com/favicon.ico" },
    { name: "Stake", logo: "https://stake.com/favicon.ico" },
    { name: "Blaze", logo: "https://blaze.com/favicon.ico" },
  ];

  const tradePlatforms = [
    { name: "Binance", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/Binance_Logo.svg" },
    { name: "Bybit", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Bybit_logo.svg" },
    { name: "OKX", logo: "https://upload.wikimedia.org/wikipedia/commons/3/38/OKX_logo.svg" },
    { name: "BitGet", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1c/Bitget_logo.svg" },
    { name: "Kraken", logo: "https://upload.wikimedia.org/wikipedia/commons/5/57/Kraken_logo.svg" },
    { name: "Coinbase Pro / Advance", logo: "https://upload.wikimedia.org/wikipedia/commons/5/50/Coinbase.svg" },
    { name: "Profit", logo: "https://www.nelogica.com.br/favicon.ico" },
    { name: "Tryd", logo: "https://www.tryd.com.br/favicon.ico" },
    { name: "Clear", logo: "https://www.clear.com.br/favicon.ico" },
  ];

  const LogoAvatar = ({ src, alt }: { src: string; alt: string }) => (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
      <img 
        src={src}
        alt={alt}
        className="h-8 w-8 object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
        }}
      />
      <span className="text-xs font-medium text-muted-foreground">{alt[0]}</span>
    </div>
  );

  return (
    <MainLayout 
      title="Configurações" 
      subtitle="Gerencie sua conta e preferências"
    >
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="glass-card grid w-full max-w-2xl grid-cols-5 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Privacidade</span>
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Catálogo</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="glass-card space-y-6 p-4 md:p-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="rounded-lg bg-primary/20 p-2 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Informações do Perfil
                </h3>
                <p className="text-sm text-muted-foreground">
                  Atualize suas informações pessoais
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button variant="aurora" onClick={handleSaveProfile}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-card">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os seus dados serão 
                      permanentemente excluídos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir Conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog">
          <div className="space-y-8">
            <div className="glass-card p-4 md:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Plataformas de Apostas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Catálogo de integração e referência visual
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bettingPlatforms.map((p) => (
                  <div key={p.name} className="glass-card aurora-border flex items-center gap-3 p-4">
                    <LogoAvatar src={p.logo} alt={p.name} />
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5 text-primary">Apostas</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 md:p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Trade Premium
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Plataformas de trade e execução profissional
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tradePlatforms.map((p) => (
                  <div key={p.name} className="glass-card aurora-border flex items-center gap-3 p-4">
                    <LogoAvatar src={p.logo} alt={p.name} />
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <span className="text-xs rounded-full bg-aurora-cyan/10 px-2 py-0.5 text-aurora-cyan">Premium</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <div className="glass-card space-y-6 p-4 md:p-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Segurança da Conta
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure opções de segurança
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
                <div className="space-y-1">
                  <Label>Criptografia de Dados</Label>
                  <p className="text-sm text-muted-foreground">
                    Seus dados são criptografados em trânsito e em repouso
                  </p>
                </div>
                <Switch
                  checked={privacy.encryption}
                  onCheckedChange={(checked) => 
                    setPrivacy({ ...privacy, encryption: checked })
                  }
                />
              </div>

              <Button variant="outline">
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </div>

            {/* Audit Logs */}
            <div className="glass-card space-y-4 p-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="rounded-lg bg-primary/20 p-2 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Logs de Auditoria
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Últimas atividades na sua conta
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-muted/30 p-3 text-sm"
                  >
                    <div>
                      <p className="text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground">{log.date}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{log.ip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="glass-card space-y-6 p-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="rounded-lg bg-primary/20 p-2 text-primary">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Preferências do Sistema
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure notificações e idioma
                </p>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Idioma
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US" disabled>
                    English (coming soon)
                  </SelectItem>
                  <SelectItem value="es" disabled>
                    Español (coming soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificações
              </Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
                  <div>
                    <p className="font-medium text-foreground">Análise Concluída</p>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações quando uma análise terminar
                    </p>
                  </div>
                  <Switch
                    checked={notifications.analysisComplete}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, analysisComplete: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
                  <div>
                    <p className="font-medium text-foreground">Atualizações do Modelo</p>
                    <p className="text-sm text-muted-foreground">
                      Saiba quando o modelo for re-treinado
                    </p>
                  </div>
                  <Switch
                    checked={notifications.modelUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, modelUpdates: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
                  <div>
                    <p className="font-medium text-foreground">Relatório Semanal</p>
                    <p className="text-sm text-muted-foreground">
                      Receba um resumo semanal das suas análises
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReport}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, weeklyReport: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                Versão do Sistema: <strong className="text-foreground">MVP v1.0</strong>
              </p>
            </div>

            <Button variant="aurora" onClick={handleSaveSettings}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Preferências
            </Button>
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <div className="glass-card space-y-6 p-4 md:p-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="rounded-lg bg-primary/20 p-2 text-primary">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Privacidade e Dados
                </h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie como seus dados são utilizados
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
              <div className="space-y-1">
                <Label>Compartilhar Dados Anônimos</Label>
                <p className="text-sm text-muted-foreground">
                  Ajude a melhorar o sistema compartilhando dados anônimos
                </p>
              </div>
              <Switch
                checked={privacy.shareAnonymousData}
                onCheckedChange={(checked) => 
                  setPrivacy({ ...privacy, shareAnonymousData: checked })
                }
              />
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <h4 className="mb-2 font-medium text-foreground">Seus Direitos</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Você pode solicitar a exclusão de todos os seus dados</li>
                <li>• Seus dados nunca são vendidos a terceiros</li>
                <li>• Todos os dados são criptografados e armazenados de forma segura</li>
              </ul>
            </div>

            <Button variant="aurora" onClick={handleSaveSettings}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Preferências
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
