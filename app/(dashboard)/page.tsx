import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, Zap } from 'lucide-react';
import Terminal from "./terminal"; // Assuming Terminal component is already modern and styled

// Supabase Feather Icon SVG component for consistent styling
const SupabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4ZM10 8.00001H14L12 16L10 8.00001Z" />
  </svg>
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Hero Section - Eye-catching gradient and bold typography */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-blue-700 to-purple-800 dark:from-gray-850 dark:to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="lg:col-span-6 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
                <span className="block text-white">My AeroVoice SaaS</span>
                <span className="block text-teal-300">Faster Than Ever for A/D Tivat</span>
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto lg:mx-0">
                Stay informed with the Tivat timetable and the AeroVoice app, ensuring you never miss an important PA announcement during your travels.
              </p>
              <div className="mt-10">
                <a href="/timetable" className="inline-flex">
                  <Button className="bg-white text-blue-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-full text-lg px-8 py-3 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                    Check today's timetable
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="mt-16 lg:mt-0 lg:col-span-6 flex justify-center items-center">
              <Terminal /> {/* This component should be visually appealing */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Section background is simpler, cards have the gradient */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900"> {/* Section background simpler */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Built with Modern Technologies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1: Next.js & React */}
            <div className="rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-700
                        bg-gradient-to-br from-blue-600 to-purple-700 text-white"> {/* Gradient for card background */}
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mb-6"> {/* Icon background is now white */}
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Next.js & React
              </h3>
              <p className="text-base text-gray-100"> {/* Adjusted text color for readability on dark background */}
                Leverage the power of modern web technologies for optimal performance, lightning-fast development, and an exceptional user experience.
              </p>
            </div>

            {/* Feature Card 2: Supabase & Postgres */}
            <div className="rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-700
                        bg-gradient-to-br from-blue-600 to-purple-700 text-white"> {/* Gradient for card background */}
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mb-6"> {/* Icon background is now white */}
                <SupabaseIcon />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Supabase & Postgres
              </h3>
              <p className="text-base text-gray-100"> {/* Adjusted text color for readability on dark background */}
                A powerful open-source Firebase alternative providing a robust Postgres database, authentication, and real-time capabilities.
              </p>
            </div>

            {/* Feature Card 3: Stripe Integration */}
            <div className="rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100 dark:border-gray-700
                        bg-gradient-to-br from-blue-600 to-purple-700 text-white"> {/* Gradient for card background */}
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white text-blue-600 mb-6"> {/* Icon background is now white */}
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Stripe Integration
              </h3>
              <p className="text-base text-gray-100"> {/* Adjusted text color for readability on dark background */}
                Seamless and secure payment processing with industry-leading Stripe integration, offering flexible subscription management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section - Identical gradient to hero */}
      <section className="py-20 bg-gradient-to-br from-blue-700 to-purple-800 dark:from-gray-850 dark:to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Elevate Your Business with Our Web App?
              </h2>
              <p className="text-lg text-blue-100 dark:text-gray-300">
                Our web app is designed to empower your business with seamless functionality and customization options. Whether you're looking to purchase a ready-to-use solution or tailor it to fit your unique needs, we have you covered. Focus on what sets your product apart while we handle the technical details.
              </p>
            </div>
            <div className="mt-10 lg:mt-0 flex justify-center lg:justify-end">
              <a href="https://razglas-tiv.vercel.app/flights" className="inline-flex">
                <Button className="bg-white text-blue-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-full text-xl px-12 py-4 shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105">
                  View the DEMO flights
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}