import { Globe } from 'lucide-react';

export default function BrandMark({ collapsed = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 border border-copel-laranja/30 bg-copel-laranja/10 rounded flex items-center justify-center shrink-0">
        <Globe size={16} className="text-copel-laranja" />
      </div>
      {!collapsed && (
        <p className="text-[15px] font-bold text-copel-grafite tracking-tight leading-none whitespace-nowrap">
          Sistema de Alvará
        </p>
      )}
    </div>
  );
}
