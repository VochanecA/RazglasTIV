// app/webcam/page.tsx
"use client";

import WebcamCapture from '@/components/ui/WebcamCapture'; // Adjust path as necessary

export default function WebcamPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <WebcamCapture />
    </div>
  );
}
