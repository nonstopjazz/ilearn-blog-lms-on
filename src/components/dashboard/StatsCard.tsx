import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon: ReactNode;
  gradient?: "primary" | "secondary" | "success" | "warning";
  className?: string;
}

export const StatsCard = ({
  title,
  value,
  change,
  icon,
  gradient = "primary",
  className
}: StatsCardProps) => {
  const gradientClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600",
    secondary: "bg-gradient-to-r from-gray-500 to-gray-700",
    success: "bg-gradient-to-r from-green-500 to-emerald-600",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-600"
  };

  return (
    <Card className={cn("shadow-lg border-0 overflow-hidden transition-all duration-300 hover:shadow-xl", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", gradientClasses[gradient])}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        {change && (
          <p className={cn(
            "text-xs flex items-center space-x-1",
            change.value > 0 ? "text-green-600" : change.value < 0 ? "text-red-600" : "text-muted-foreground"
          )}>
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              change.value > 0 ? "bg-green-100 text-green-600" :
              change.value < 0 ? "bg-red-100 text-red-600" :
              "bg-gray-100 text-muted-foreground"
            )}>
              {change.value > 0 ? "+" : ""}{change.value}%
            </span>
            <span>{change.label}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};