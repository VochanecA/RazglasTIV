"use client";
import Link from 'next/link';
import { CircleIcon } from 'lucide-react';

export default function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <CircleIcon className="size-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Something Went Wrong
        </h1>
        <p className="text-base text-gray-500">
          We encountered an unexpected error while processing your request. Please try again later.
        </p>
        <Link
          href="/"
          className="max-w-48 mx-auto flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
