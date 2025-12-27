import { Package } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500">Product catalog and documentation</p>
        </div>
      </div>

      <div className="p-8 border border-dashed border-gray-300 rounded-lg text-center">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No products documented yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Add your product information and documentation here
        </p>
      </div>
    </div>
  );
}

