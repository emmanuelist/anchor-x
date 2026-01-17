import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface PortfolioChartProps {
  usdcBalance: number;
  usdcxBalance: number;
}

const COLORS = {
  usdc: 'hsl(225, 58%, 66%)', // Ethereum blue
  usdcx: 'hsl(249, 100%, 58%)', // Stacks purple
};

export function PortfolioChart({ usdcBalance, usdcxBalance }: PortfolioChartProps) {
  const total = usdcBalance + usdcxBalance;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No assets to display
      </div>
    );
  }

  const data = [
    { name: 'USDC', value: usdcBalance, color: COLORS.usdc },
    { name: 'USDCx', value: usdcxBalance, color: COLORS.usdcx },
  ].filter(d => d.value > 0);

  const usdcPercent = ((usdcBalance / total) * 100).toFixed(1);
  const usdcxPercent = ((usdcxBalance / total) * 100).toFixed(1);

  return (
    <motion.div 
      className="flex items-center gap-3 sm:gap-4 md:gap-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={20}
              outerRadius={36}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke="transparent"
                  className="transition-opacity hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" 
            style={{ backgroundColor: COLORS.usdc }}
          />
          <span className="text-xs sm:text-sm">USDC</span>
          <span className="text-xs sm:text-sm text-muted-foreground font-mono">{usdcPercent}%</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" 
            style={{ backgroundColor: COLORS.usdcx }}
          />
          <span className="text-xs sm:text-sm">USDCx</span>
          <span className="text-xs sm:text-sm text-muted-foreground font-mono">{usdcxPercent}%</span>
        </div>
      </div>
    </motion.div>
  );
}
