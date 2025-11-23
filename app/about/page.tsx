import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Star, Shield, Globe, Rocket, Users, Target, Lightbulb, Handshake, Megaphone, Plane, Clock, CheckCircle } from 'lucide-react';

// Stats component for showing metrics - identičan kao u dashboardu
const StatsSection = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
    {[
      { number: '10K+', label: 'Daily Passengers' },
      { number: '99.9%', label: 'System Uptime' },
      { number: '50ms', label: 'Response Time' },
      { number: '24/7', label: 'Airport Support' }
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

// Timeline component for company milestones
const TimelineSection = () => (
  <div className="max-w-4xl mx-auto">
    <div className="space-y-8">
      {[
        { year: '2023', title: 'Foundation', description: 'AeroVoice Pro was born from the need for better airport communication systems at Tivat Airport.' },
        { year: '2024', title: 'Launch', description: 'Successfully deployed our first production system handling real-time flight announcements.' },
        { year: '2024', title: 'Expansion', description: 'Integrated with multiple airline systems and expanded to handle 1000+ daily announcements.' },
        { year: '2025', title: 'Innovation', description: 'Introducing AI-powered scheduling and predictive announcement systems.' }
      ].map((milestone, index) => (
        <div key={index} className="flex gap-6 group">
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-4 border-white dark:border-gray-900 group-hover:scale-125 transition-transform duration-300"></div>
            <div className="flex-1 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 mt-2"></div>
          </div>
          <div className="flex-1 pb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group-hover:scale-[1.02]">
              <div className="flex items-center gap-4 mb-3">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {milestone.year}
                </div>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-200 to-purple-200"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{milestone.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{milestone.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      
      {/* Enhanced Hero Section - identičan dizajn kao dashboard */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Star className="h-4 w-4 mr-2 text-yellow-300" />
                <span className="text-sm font-medium text-white">Trusted by Tivat Airport</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
                <span className="block text-white bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  About AeroVoice
                </span>
                <span className="block text-teal-300 mt-2">Airport Communication Revolution</span>
              </h1>
              
              <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Discover how AeroVoice Pro is transforming airport operations through intelligent public announcement systems, real-time flight tracking, and seamless passenger communication.
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
                <a href="#mission" className="inline-flex">
                  <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl text-lg px-8 py-4 backdrop-blur-sm transition-all duration-300 font-semibold">
                    Our Mission
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="mt-16 lg:mt-0 lg:col-span-5 flex justify-center items-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-lg opacity-30"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                  <div className="text-center">
                    <Megaphone className="h-20 w-20 text-white mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">PA System</h3>
                    <p className="text-blue-100">Advanced Airport Announcements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4">
              <Target className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">OUR MISSION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
              Revolutionizing Airport Communication
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              We're dedicated to creating seamless, efficient, and intelligent communication systems that enhance the airport experience for passengers and staff alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What is PA AeroVoice?</h3>
              <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
                <p>
                  <strong className="font-semibold text-blue-600 dark:text-blue-400">PA AeroVoice Pro</strong> is a specialized Public Announcement system designed specifically for the dynamic environment of Tivat Airport. Our application ensures that all critical announcements are delivered clearly and efficiently.
                </p>
                <p>
                  From flight boarding calls to important security messages, AeroVoice streamlines the process of creating, scheduling, and broadcasting announcements, reducing manual errors and improving passenger experience.
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <CheckCircle size={16} />
                  <span>Real-time flight integration</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <CheckCircle size={16} />
                  <span>Multi-language support</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <CheckCircle size={16} />
                  <span>AI-powered scheduling</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white text-center">
                <Plane className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm text-blue-100">Daily Flights</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl p-6 text-white text-center">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm text-green-100">Passengers Daily</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white text-center">
                <Megaphone className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">1K+</div>
                <div className="text-sm text-purple-100">Daily Announcements</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white text-center">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-orange-100">Operation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Enhanced with gradient cards */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4">
              <Rocket className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">CORE VALUES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
              What Drives Our Innovation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Value 1: Efficiency */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative rounded-2xl p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Efficiency
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Streamlining airport operations with automated and precise public announcement delivery, reducing manual workload by 70%.
                </p>
              </div>
            </div>

            {/* Value 2: Innovation */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative rounded-2xl p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Innovation
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Continuously evolving our technology with AI-powered scheduling and predictive systems for modern airport communication.
                </p>
              </div>
            </div>

            {/* Value 3: Reliability */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <div className="relative rounded-2xl p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Handshake className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Reliability
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  99.9% uptime guarantee with enterprise-grade infrastructure ensuring uninterrupted airport operations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-4">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">OUR JOURNEY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-700 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
              Building the Future of Airport Tech
            </h2>
          </div>
          <TimelineSection />
        </div>
      </section>

      {/* Enhanced CTA Section - identičan dizajn kao dashboard */}
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
                <span className="text-sm font-medium text-white">READY TO DEPLOY</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Transform Airport Communication
              </h2>
              
              <div className="space-y-4 mb-8">
                {[
                  "AI-powered announcement scheduling",
                  "Real-time flight tracking integration", 
                  "Multi-language passenger support",
                  "Advanced analytics dashboard",
                  "99.9% system reliability"
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
                  See how our platform can revolutionize passenger communication and airport operations management at Tivat Airport.
                </p>
                <div className="space-y-4">
                  <a href="https://razglas-tiv.vercel.app/timetable" className="block w-full">
                    <Button className="w-full bg-white text-blue-700 hover:bg-gray-50 rounded-2xl text-lg py-4 shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 font-semibold">
                      <Play className="mr-3 h-5 w-5" />
                      Live Demo Experience
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                  <a href="/contact" className="block w-full">
                    <Button variant="outline" className="w-full border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl text-lg py-4 backdrop-blur-sm transition-all duration-300 font-semibold">
                      Schedule Airport Demo
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}