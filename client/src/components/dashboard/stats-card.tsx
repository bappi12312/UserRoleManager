import { formatCurrency } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  change: string;
  iconBgColor: string;
  iconColor: string;
  isCurrency?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  iconBgColor,
  iconColor,
  isCurrency = false
}: StatsCardProps) {
  const displayValue = isCurrency ? formatCurrency(Number(value)) : value;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${iconBgColor} flex items-center justify-center mr-4`}>
          <i className={`ri-${icon} text-xl ${iconColor}`}></i>
        </div>
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-semibold text-gray-800">{displayValue}</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-green-600 flex items-center">
        <i className="ri-arrow-up-line mr-1"></i>
        <span>{change}</span>
      </div>
    </div>
  );
}
