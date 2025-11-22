import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, Zap, Play, Star, Shield, Globe, Rocket } from 'lucide-react';
import Terminal from "./terminal";

// Custom Supabase Icon with modern styling
const SupabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4ZM10 8.00001H14L12 16L10 8.00001Z" />
  </svg>
);

// Stats component for showing metrics
const StatsSection = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
    {[
      { number: '99.9%', label: 'Uptime' },
      { number: '50ms', label: 'Response Time' },
      { number: '24/7', label: 'Support' },
      { number: '1000+', label: 'Daily Users' }
    ].map((stat, index) => (
      <div 
        key={stat.label}
        className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300"
      >
        <div className="text-2xl md:text-3xl font-bold text-white mb-2">{stat.number}</div>
        <div className="text-blue-100 text-sm font-medium">{stat.label}</div>
      </div>
    ))}
  </div>
);

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      
      {/* Enhanced Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="lg:col-span-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Star className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="text-sm font-medium text-white">Trusted by Tivat Airport</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
                <span className="block text-white bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  AeroVoice Pro
                </span>
                <span className="block text-teal-300 mt-2">Real-time Airport Intelligence</span>
              </h1>
              
              <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Advanced PA announcement system with AI-powered scheduling, real-time flight tracking, and seamless passenger communication for Tivat Airport.
              </p>

              {/* Stats */}
              <div className="mt-8">
                <StatsSection />
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="/timetable" className="inline-flex">
                  <Button className="bg-white text-blue-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 rounded-2xl text-lg px-8 py-4 shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl font-semibold">
                    <Play className="mr-3 h-5 w-5" />
                    Live Timetable
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <a href="#features" className="inline-flex">
                  <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl text-lg px-8 py-4 backdrop-blur-sm transition-all duration-300 font-semibold">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="mt-16 lg:mt-0 lg:col-span-6 flex justify-center items-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-lg opacity-30"></div>
                <Terminal />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4">
              <Rocket className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">TECHNOLOGY STACK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
              Built for Performance & Scale
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Powered by cutting-edge technologies to deliver unmatched reliability and speed for airport operations.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Next.js & React */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative rounded-2xl p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Next.js & React
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Lightning-fast React framework with server-side rendering, automatic code splitting, and optimized performance for real-time applications.
                </p>
                <div className="mt-6 flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                  <span>Learn more</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Feature 2: Supabase & Postgres */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative rounded-2xl p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <SupabaseIcon />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Supabase & Postgres
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Enterprise-grade PostgreSQL database with real-time subscriptions, row-level security, and automatic API generation.
                </p>
                <div className="mt-6 flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                  <span>Explore database</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Feature 3: Stripe Integration */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative rounded-2xl p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Stripe Payments
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Secure payment processing with subscription management, instant payouts, and comprehensive financial reporting.
                </p>
                <div className="mt-6 flex items-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                  <span>View pricing</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Enterprise Security</h4>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Bank-level encryption, SOC 2 compliance, and regular security audits to protect your data and operations.
              </p>
            </div>
            
            <div className="rounded-2xl p-8 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-100 dark:border-green-800">
              <div className="flex items-center mb-4">
                <Globe className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Global CDN</h4>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Content delivery network with 200+ edge locations worldwide for lightning-fast global performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 dark:from-black dark:via-purple-950 dark:to-blue-950 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Rocket className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="text-sm font-medium text-white">READY TO LAUNCH</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Transform Your Airport Operations
              </h2>
              
              <div className="space-y-4 mb-8">
                {[
                  "AI-powered announcement scheduling",
                  "Real-time flight tracking integration", 
                  "Multi-language support",
                  "Advanced analytics dashboard"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-lg text-blue-100">
                    <div className="w-2 h-2 bg-teal-400 rounded-full mr-3"></div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-10 lg:mt-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-4 text-white">Experience AeroVoice Pro</h3>
                <p className="text-blue-100 mb-6">
                  See how our platform can revolutionize passenger communication and airport operations management.
                </p>
                <div className="space-y-4">
                  <a href="https://razglas-tiv.vercel.app/flights" className="block w-full">
                    <Button className="w-full bg-white text-blue-700 hover:bg-gray-50 rounded-2xl text-lg py-4 shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 font-semibold">
                      <Play className="mr-3 h-5 w-5" />
                      Live Demo Experience
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                  <a href="/contact" className="block w-full">
                    <Button variant="outline" className="w-full border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl text-lg py-4 backdrop-blur-sm transition-all duration-300 font-semibold">
                      Schedule a Demo
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}