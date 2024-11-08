'use client';

const Skeleton = ({ className = '' }: { className?: string }) => {
  const baseClasses = "bg-gray-200 dark:bg-gray-700 animate-pulse rounded";
  return (
    <div className={`${baseClasses} ${className}`} />
  );
};

export { Skeleton };