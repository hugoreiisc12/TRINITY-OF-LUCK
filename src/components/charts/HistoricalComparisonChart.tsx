import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  ComposedChart
} from "recharts";

interface DataPoint {
  event: string;
  probability: number;
  confidence: number;
  date: string;
}

interface HistoricalComparisonChartProps {
  data: DataPoint[];
  currentProbability?: number;
  title?: string;
}

export function HistoricalComparisonChart({ 
  data, 
  currentProbability = 72,
  title = "Comparação Histórica" 
}: HistoricalComparisonChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-muted-foreground">
            Probabilidade: <span className="text-primary">{payload[0]?.value}%</span>
          </p>
          <p className="text-muted-foreground">
            Confiança: <span className="text-aurora-green">{payload[1]?.value}%</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{payload[0]?.payload.date}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-aurora-cyan" />
            <span className="text-muted-foreground">Probabilidade</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-aurora-green" />
            <span className="text-muted-foreground">Confiança</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="probabilityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(180, 100%, 50%)" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="hsl(180, 100%, 50%)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.2}/>
              <stop offset="100%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(175, 30%, 15%)" />
          <XAxis 
            dataKey="event" 
            stroke="hsl(180, 20%, 60%)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="hsl(180, 20%, 60%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone"
            dataKey="probability"
            fill="url(#probabilityGradient)"
            stroke="transparent"
          />
          <Line 
            type="monotone" 
            dataKey="probability" 
            stroke="hsl(180, 100%, 50%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(180, 100%, 50%)', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: 'hsl(180, 100%, 50%)', stroke: 'hsl(180, 100%, 70%)', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="confidence" 
            stroke="hsl(160, 84%, 45%)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: 'hsl(160, 84%, 45%)', strokeWidth: 0, r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
