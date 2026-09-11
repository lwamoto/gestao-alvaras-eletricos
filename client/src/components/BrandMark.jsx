import { Globe } from 'lucide-react';

export default function BrandMark({ collapsed = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 border border-gray-300 bg-white rounded flex items-center justify-center shrink-0">
        <Globe size={16} className="text-blue-600" />
      </div>
      {!collapsed && (
        <p className="text-[15px] font-bold text-gray-900 tracking-tight leading-none whitespace-nowrap">
          Sistema de Alvará
        </p>
      )}
    </div>
  );
}
