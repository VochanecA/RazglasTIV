// components/ui/Skeleton.tsx
import React from 'react';

const Skeleton = ({ className = '' }: { className?: string }) => {
  const baseClasses = "bg-gray-200 dark:bg-gray-700 animate-pulse rounded";
  return <div className={`${baseClasses} ${className}`} />;
};

export default Skeleton;
