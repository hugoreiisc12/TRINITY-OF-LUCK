import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from "recharts";

interface DataPoint {
  range: string;
  frequency: number;
  probability: number;
}

interface ProbabilityDistributionChartProps {
  data: DataPoint[];
  currentValue?: number;
  title?: string;
}

export function ProbabilityDistributionChart({ 
  data, 
  currentValue = 72,
  title = "Distribuição Probabilística" 
}: ProbabilityDistributionChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-muted-foreground">
            Frequência: <span className="text-primary">{payload[0].value}</span>
          </p>
          <p className="text-muted-foreground">
            Probabilidade: <span className="text-aurora-green">{payload[0].payload.probability}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(180, 100%, 50%)" stopOpacity={1}/>
              <stop offset="100%" stopColor="hsl(160, 84%, 45%)" stopOpacity={0.6}/>
            </linearGradient>
            <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(145, 80%, 50%)" stopOpacity={1}/>
              <stop offset="100%" stopColor="hsl(160, 84%, 40%)" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(175, 30%, 15%)" />
          <XAxis 
            dataKey="range" 
            stroke="hsl(180, 20%, 60%)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="hsl(180, 20%, 60%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            x={`${Math.floor(currentValue / 10) * 10}-${Math.floor(currentValue / 10) * 10 + 10}%`}
            stroke="hsl(180, 100%, 50%)"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{
              value: `Atual: ${currentValue}%`,
              position: 'top',
              fill: 'hsl(180, 100%, 50%)',
              fontSize: 12
            }}
          />
          <Bar 
            dataKey="frequency" 
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.probability >= currentValue - 5 && entry.probability <= currentValue + 5 
                  ? "url(#activeGradient)" 
                  : "url(#barGradient)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
