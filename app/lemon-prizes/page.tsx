import { Citrus } from "lucide-react";

export default function LemonPrizesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <Citrus className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Lemon Prizes</h1>
          <p className="text-gray-500">When life gives you lemons, make it memorable</p>
        </div>
      </div>

      <div className="p-8 border border-dashed border-gray-300 rounded-lg text-center">
        <Citrus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No lemon prizes awarded yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Sometimes things don&apos;t go as planned — and that&apos;s okay
        </p>
      </div>
    </div>
  );
}

