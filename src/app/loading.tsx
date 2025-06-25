export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            正在加载...
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            请稍候，正在加载页面内容
          </p>
        </div>
      </div>
    </div>
  );
}
