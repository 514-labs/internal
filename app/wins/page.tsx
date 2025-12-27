import { Trophy } from "lucide-react";

export default function WinsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Trophy className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Wins</h1>
          <p className="text-gray-500">Celebrate team achievements and victories</p>
        </div>
      </div>

      <div className="p-8 border border-dashed border-gray-300 rounded-lg text-center">
        <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No wins recorded yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Start celebrating your team&apos;s achievements here
        </p>
      </div>
    </div>
  );
}

