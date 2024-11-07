import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, Database } from 'lucide-react';
import Terminal from "./terminal";

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl 
               text-gray-900 dark:text-green-500">
  My AeroVoice SaaS
  <span className="block text-orange-500">Faster Than Ever for A/D Tivat</span>
</h1>
<p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
  Stay informed with the Tivat timetable and the AeroVoice app, ensuring you never miss an important PA announcement during your travels.
</p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
              <a href="/timetable">
  <Button className="bg-white hover:bg-gray-100 text-black border border-gray-200 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center">
  Check today's timetable.
    <ArrowRight className="ml-2 h-5 w-5" />
  </Button>
</a>

              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-800 w-full">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
      {/* First Card */}
      <div>
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path fill="currentColor" d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236z..." />
          </svg>
        </div>
        <div className="mt-5">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Next.js and React
          </h2>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            Leverage the power of modern web technologies for optimal performance and developer experience.
          </p>
        </div>
      </div>

      {/* Second Card */}
      <div className="mt-10 lg:mt-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
          <Database className="h-6 w-6" />
        </div>
        <div className="mt-5">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Postgres and Drizzle ORM
          </h2>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            Robust database solution with an intuitive ORM for efficient data management and scalability.
          </p>
        </div>
      </div>

      {/* Third Card */}
      <div className="mt-10 lg:mt-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
          <CreditCard className="h-6 w-6" />
        </div>
        <div className="mt-5">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Stripe Integration
          </h2>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
            Seamless payment processing and subscription management with industry-leading Stripe integration.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>


<section className="py-16 bg-white dark:bg-gray-600 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
  Ready to Elevate Your Business with Our Web App?
</h2>
<p className="mt-3 max-w-3xl text-lg text-yellow-500">
  Our web app is designed to empower your business with seamless functionality and customization options. Whether you're looking to purchase a ready-to-use solution or tailor it to fit your unique needs, we have you covered. Focus on what sets your product apart while we handle the technical details.
</p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <a
                href="https://razglas-tiv.vercel.app/flights"
          
              >
                <Button className="bg-white hover:bg-gray-100 text-black border border-gray-200 rounded-full text-xl px-12 py-6 inline-flex items-center justify-center">
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
