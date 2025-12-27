import { Wrench } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Wrench className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-gray-500">Service offerings and capabilities</p>
        </div>
      </div>

      <div className="p-8 border border-dashed border-gray-300 rounded-lg text-center">
        <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No services documented yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Document your service offerings and capabilities here
        </p>
      </div>
    </div>
  );
}

