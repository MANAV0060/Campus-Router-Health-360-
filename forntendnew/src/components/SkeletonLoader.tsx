import React from 'react';

export const KPISkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="bg-white dark:bg-[#080b13] border border-gray-200 dark:border-[#1d2939] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded-md shimmer-bg" />
            <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-800 shimmer-bg" />
          </div>
          <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 shimmer-bg" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded-md shimmer-bg" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#080b13] border border-gray-200 dark:border-[#1d2939] rounded-2xl p-6 shadow-xs">
      <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded-md mb-6 shimmer-bg" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 w-full bg-gray-100 dark:bg-gray-900 rounded-lg shimmer-bg" />
        ))}
      </div>
    </div>
  );
};
