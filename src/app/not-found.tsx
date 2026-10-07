import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#14213d] text-white flex items-center justify-center font-black text-2xl mb-4">
        404
      </div>
      <h1 className="text-2xl font-black text-[#14213d] dark:text-white mb-2">Page Not Found</h1>
      <p className="text-xs text-[#526079] dark:text-slate-400 max-w-sm mb-6">
        The test series or paper page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button variant="emerald" size="md">
          Return to Homepage
        </Button>
      </Link>
    </div>
  );
}
