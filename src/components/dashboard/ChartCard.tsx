import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  children: ReactNode;
  description?: string;
  className?: string;
}

export const ChartCard = ({ title, children, description, className }: ChartCardProps) => {
  return (
    <Card className={cn("shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 transition-all duration-300 hover:shadow-xl", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center justify-between">
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {children}
      </CardContent>
    </Card>
  );
};