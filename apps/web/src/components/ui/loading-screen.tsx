import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LoadingScreenProps {
  className?: string;
}

export function LoadingScreen({ className }: LoadingScreenProps) {
  return (
    <div className={cn("fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center", className)}>
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Outer Ring - Deep Color */}
        <div className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]">
            <div className="h-full w-full rounded-full border-[3px] border-blue-100 dark:border-blue-900/30"></div>
             {/* Orbital Dot */}
            <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
        </div>

        {/* Inner Ring - Light Color (Reverse rotation) */}
        <div className="absolute w-22 h-22 animate-[spin_4s_linear_infinite_reverse]">
            <div className="h-full w-full rounded-full border-[3px] border-blue-50 dark:border-blue-900/20"></div>
             {/* Orbital Dot */}
            <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-blue-400/80 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
        </div>
        
        {/* Center Icon (Logo) */}
        <div className="absolute flex items-center justify-center z-10 bg-white dark:bg-gray-900 rounded-full p-1">
           <Image 
             src="/docStudio_icon.png" 
             alt="DocStudio Logo" 
             width={56} 
             height={56} 
             className="w-14 h-14 object-contain rounded-full"
           />
        </div>
      </div>
      
      <p className="mt-8 text-gray-500 dark:text-gray-400 font-medium animate-pulse tracking-wide">
        DocStudio
      </p>
    </div>
  );
}
