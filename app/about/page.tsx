// app/about/page.tsx
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Lightbulb, Handshake, Megaphone } from 'lucide-react'; // Added relevant Lucide icons

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">

      {/* Hero Section - About Us */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-blue-700 to-purple-800 dark:from-gray-850 dark:to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            <span className="block text-white">About AeroVoice</span>
            <span className="block text-teal-300">Connecting You to Tivat Airport</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto">
            Discover the story behind AeroVoice and our commitment to enhancing the airport experience through clear, timely public announcements.
          </p>
          <div className="mt-10">
            <a href="https://razglas-tiv.vercel.app/timetable" target="_blank" rel="noopener noreferrer" className="inline-flex">
              <Button className="bg-white text-blue-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-full text-lg px-8 py-3 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                View Live Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* What is AeroVoice? Section - Specific text about the app */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="mb-10 lg:mb-0">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                What is PA AeroVoice?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                <strong className="font-semibold text-blue-600 dark:text-teal-400">PA AeroVoice</strong> is a specialized Public Announcement (PA) system designed specifically for the dynamic environment of Tivat Airport. Our application ensures that all critical announcements, from flight boarding calls to important security messages, are delivered clearly and efficiently.
              </p>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                We understand the importance of timely information in an airport setting. AeroVoice streamlines the process of creating, scheduling, and broadcasting announcements, reducing manual errors and improving the overall passenger experience at Tivat.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              {/* Placeholder for an image or illustration related to airport announcements */}
              <div className="w-full max-w-md h-64 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 text-center p-4">
                <Megaphone className="h-20 w-20 text-gray-400 dark:text-gray-500" />
                <span className="ml-4 text-xl font-medium">Airport PA System Illustration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values/Mission Section - Gradient Cards */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Efficiency */}
            <div className="rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-700
                        bg-gradient-to-br from-blue-600 to-purple-700 text-white">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mb-6">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Efficiency
              </h3>
              <p className="text-base text-gray-100">
                Streamlining airport operations with automated and precise public announcement delivery.
              </p>
            </div>

            {/* Card 2: Innovation */}
            <div className="rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-700
                        bg-gradient-to-br from-blue-600 to-purple-700 text-white">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mb-6">
                <Lightbulb className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Innovation
              </h3>
              <p className="text-base text-gray-100">
                Continuously evolving our technology to meet the demands of modern airport communication.
              </p>
            </div>

            {/* Card 3: Reliability */}
            <div className="rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-700
                        bg-gradient-to-br from-blue-600 to-purple-700 text-white">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mb-6">
                <Handshake className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Reliability
              </h3>
              <p className="text-base text-gray-100">
                Ensuring consistent and dependable performance for uninterrupted airport operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section - Identical gradient to hero */}
      <section className="py-20 bg-gradient-to-br from-blue-700 to-purple-800 dark:from-gray-850 dark:to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Streamline Your Airport Announcements?
          </h2>
          <p className="text-lg text-blue-100 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Explore AeroVoice and see how our system can transform public communication at Tivat Airport.
          </p>
          <a href="https://razglas-tiv.vercel.app/flights" className="inline-flex">
            <Button className="bg-white text-blue-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-full text-xl px-12 py-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
              Get Started with AeroVoice
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </a>
        </div>
      </section>
    </main>
  );
}