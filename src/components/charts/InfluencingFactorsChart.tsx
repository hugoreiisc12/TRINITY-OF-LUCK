import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

interface Factor {
  name: string;
  weight: number;
  description?: string;
}

interface InfluencingFactorsChartProps {
  data: Factor[];
  title?: string;
}

const COLORS = [
  'hsl(180, 100%, 50%)',   // cyan
  'hsl(160, 84%, 45%)',    // teal
  'hsl(145, 80%, 40%)',    // green
  'hsl(200, 80%, 50%)',    // blue
  'hsl(270, 60%, 60%)',    // purple
];

export function InfluencingFactorsChart({ 
  data, 
  title = "Fatores Influentes" 
}: InfluencingFactorsChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium text-foreground">{item.name}</p>
          <p className="text-muted-foreground">
            Peso: <span className="text-primary">{item.weight}%</span>
          </p>
          {item.description && (
            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.08) return null;

    return (
      <text
        x={x}
        y={y}
        fill="hsl(180, 100%, 97%)"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <defs>
              {COLORS.map((color, index) => (
                <linearGradient key={index} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1}/>
                  <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="weight"
              labelLine={false}
              label={CustomLabel}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#pieGradient${index % COLORS.length})`}
                  stroke="hsl(222, 47%, 8%)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="space-y-3 w-full lg:w-auto">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-3">
              <div 
                className="h-3 w-3 rounded-full shadow-lg"
                style={{ 
                  backgroundColor: COLORS[index % COLORS.length],
                  boxShadow: `0 0 10px ${COLORS[index % COLORS.length]}50`
                }}
              />
              <span className="text-sm text-foreground">{item.name}</span>
              <span className="ml-auto text-sm font-medium text-muted-foreground">
                {item.weight}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
