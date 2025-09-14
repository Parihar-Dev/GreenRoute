import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaBrain, FaCloudSun, FaChargingStation, FaCarBattery, FaHistory, FaPoundSign } from 'react-icons/fa';
import { Zap, Navigation, MapPin, Battery, CheckCircle, ArrowRight, Mail, Phone } from 'lucide-react';
import { useSelector } from 'react-redux';
import HeroImage from '../assets/Hero.png';
import Logo from '../assets/Logo.png';

const steps = [
    {
        id: '01',
        icon: MapPin,
        title: 'Set Your Destination',
        description: 'Enter your starting point and destination. Add any stops or preferences for your journey.',
        color: 'text-emerald-400'
    },
    {
        id: '02',
        icon: Navigation,
        title: 'Get Smart Route',
        description: 'Our AI analyzes traffic, elevation, weather, and charging stations to create the optimal route.',
        color: 'text-blue-400'
    },
    {
        id: '03',
        icon: Battery,
        title: 'Plan Charging Stops',
        description: 'Automatically calculate the best charging stops based on your vehicle specs and route.',
        color: 'text-amber-400'
    },
    {
        id: '04',
        icon: CheckCircle,
        title: 'Start Your Journey',
        description: 'Follow turn-by-turn navigation with real-time updates and charging station availability.',
        color: 'text-green-400'
    }
];

const features = [
    {
        icon: FaBrain,
        title: 'AI-Powered Predictions',
        description: 'Our core ML model provides highly accurate energy consumption forecasts for any trip.',
    },
    {
        icon: FaCloudSun,
        title: 'Real-Time Data',
        description: 'We integrate live traffic and weather data to ensure your route is always optimized for current conditions.',
    },
    {
        icon: FaChargingStation,
        title: 'Smart Charging Stops',
        description: 'For long journeys, our app automatically finds and integrates the most convenient charging stations.',
    },
    {
        icon: FaCarBattery,
        title: 'Custom Vehicle Profiles',
        description: 'Add your specific EV model to get route calculations tailored to its battery and efficiency characteristics.',
    },
    {
        icon: FaHistory,
        title: 'Trip History & Analytics',
        description: "Review your past trips to see how much energy, time, and money you've saved over time.",
    },
    {
        icon: FaPoundSign,
        title: 'Cost Estimation',
        description: 'Get an estimated cost for your trip based on local electricity tariffs and charging fees.',
    },
];


const useScrollFadeIn = (threshold = 0.1) => {
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-visible');
                    observer.unobserve(entry.target);
                }
            },
            { threshold }
        );
        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }
        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [threshold]);
    return ref;
};

function Home() {
    const user = useSelector(state => state.auth.user);
    const featuresRef = useScrollFadeIn();
    const howItWorksRef = useScrollFadeIn();
    const ctaRef = useScrollFadeIn();

    return (
        <main className='bg-slate-950 text-slate-100'>

            <header className='relative h-screen bg-cover bg-center flex flex-col items-center justify-center text-center' style={{ backgroundImage: `url(${HeroImage})` }}>
                <div className="absolute inset-0 bg-black/50" aria-hidden="true"></div>
                <div className="relative z-10 px-4 animate-fade-in-up">
                    <h1 className='text-5xl md:text-7xl font-normal mb-4 text-white drop-shadow-lg leading-tight'>
                        Navigate Smarter,<br />Drive Greener.
                    </h1>
                    <p className='text-lg md:text-xl max-w-2xl mx-auto font-light mb-8 text-slate-200 drop-shadow-md'>
                        AI-powered route planning for electric vehicles to maximize your range and minimize your footprint.
                    </p>
                    <Link to={user ? "/dashboard" : "/register"} className='inline-block bg-[#00E676] text-black font-normal text-lg px-8 py-4 rounded-full hover:bg-green-400 transition duration-300 transform hover:scale-105 shadow-2xl'>
                        {user ? "Start Planning Your Route" : "Get Started For Free"}
                    </Link>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-900 fade-in" ref={featuresRef}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className='text-center mb-16'>
                        <div className="inline-flex items-center px-4 py-2 bg-slate-800/50 rounded-full text-emerald-400 text-sm font-medium mb-6 border border-slate-700">
                            <Zap className="h-4 w-4 mr-2" />
                            Powerful Features
                        </div>
                        <h2 className="text-4xl md:text-5xl font-normal leading-tight text-white mb-6">
                            Everything You Need for
                            <span className="block text-emerald-400">Perfect EV Trips</span>
                        </h2>
                        <p className="text-xl text-slate-300 font-light max-w-3xl mx-auto">
                            Our comprehensive suite of tools makes electric vehicle travel seamless, efficient, and worry-free.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title} className="bg-slate-800/50 border border-slate-700 p-8 rounded-xl transition-all duration-300 hover:bg-slate-800/70 hover:scale-105 backdrop-blur-sm group">
                                    <Icon className="text-4xl text-[#00E676] mb-6 group-hover:scale-110 transition-all duration-300" />
                                    <h3 className="text-xl font-normal text-white mb-4">{feature.title}</h3>
                                    <p className="text-slate-400 font-light">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 fade-in" ref={howItWorksRef}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center px-4 py-2 bg-slate-800/50 rounded-full text-emerald-400 text-sm font-medium mb-6 border border-slate-700">
                            <Navigation className="h-4 w-4 mr-2" />
                            How It Works
                        </div>
                        <h2 className="text-4xl md:text-5xl font-normal text-white mb-6">
                            Plan Your Trip in
                            <span className="block text-emerald-400">4 Simple Steps</span>
                        </h2>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto font-light">
                            From planning to arrival, GreenRoute makes EV travel effortless with intelligent route optimization and real-time assistance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon; // Component must be uppercase
                            return (
                                <div key={step.id} className="relative">
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-slate-700 to-transparent transform translate-x-4 z-0" aria-hidden="true" />
                                    )}

                                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl h-full hover:bg-slate-900/70 transition-all duration-300 hover:scale-105 backdrop-blur-sm relative z-10">
                                        <div className="p-8 text-center">
                                            <div className="relative mb-6">
                                                <div className="inline-flex p-4 rounded-2xl bg-slate-800/50 mb-4">
                                                    <Icon className={`h-8 w-8 ${step.color}`} />
                                                </div>
                                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-light px-2 py-1 rounded-full">
                                                    {step.id}
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-normal text-white mb-4">{step.title}</h3>
                                            <p className="text-slate-300 font-light leading-relaxed">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-center mt-16">
                        <button type="button" className="inline-flex items-center px-6 py-3 bg-slate-800/50 rounded-full text-slate-300 text-sm border border-slate-700 hover:bg-slate-800/70 transition-all duration-300">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-3 animate-pulse" aria-hidden="true"></span>
                            Watch a 2-minute demo of GreenRoute in action
                        </button>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="py-20 px-6 bg-slate-900 fade-in" ref={ctaRef}>
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-gradient-to-r from-slate-900/90 to-slate-800/90 rounded-3xl p-12 md:p-16 border border-slate-700 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl" aria-hidden="true"></div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl transform translate-x-48 -translate-y-48" aria-hidden="true"></div>
                        <div className="relative z-10 text-center">
                            <h2 className="text-4xl md:text-5xl font-normal text-white mb-6">
                                Ready to Transform Your
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                    EV Travel Experience?
                                </span>
                            </h2>
                            <p className="text-xl text-slate-300 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
                                Join thousands of EV drivers who trust GreenRoute for smarter, more efficient electric vehicle journeys.
                            </p>
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    className="flex justify-center items-center bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-emerald-500/25 group"
                                >
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-slate-800 py-16 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-1 flex flex-col space-y-10">
                            <Link to='/' aria-label="GreenRoute Home">
                                <img src={Logo} alt='GreenRoute Logo' className='h-6' />
                            </Link>
                            <div className="flex space-x-4">
                                <a href="https://x.com/RahulParih50667" target='_blank' aria-label="Twitter" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                    </svg>
                                </a>
                                <a href="https://github.com/Parihar-Dev" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 018 4.6c.68.003 1.36.092 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                                    </svg>
                                </a>
                                <a href="https://www.linkedin.com/in/rahulparihar0203" target='_blank' rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-6">Product</h3>
                            <ul className="space-y-4">
                                <li><Link to="/features" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">Features</Link></li>
                                <li><Link to="/pricing" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">Pricing</Link></li>
                                <li><Link to="/api" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">API</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-6">Company</h3>
                            <ul className="space-y-4">
                                <li><Link to="/about" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">About Us</Link></li>
                                <li><Link to="/careers" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">Careers</Link></li>
                                <li><Link to="/blog" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">Blog</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-semibold mb-6">Contact</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center text-slate-400">
                                    <Mail className="h-4 w-4 mr-3 shrink-0" />
                                    <a href="mailto:admin@greenroute.com" className="hover:text-emerald-400">admin@greenroute.com</a>
                                </li>
                                <li className="flex items-center text-slate-400">
                                    <Phone className="h-4 w-4 mr-3 shrink-0" />
                                    <a href="tel:+917499237414" className="hover:text-emerald-400">+91 74992 37414</a>
                                </li>
                                <li className="flex items-start text-slate-400">
                                    <MapPin className="h-4 w-4 mr-3 mt-1 shrink-0" />
                                    <span>Pune, Maharashtra - 411037</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 text-center md:text-left">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-slate-400 text-sm mb-4 md:mb-0">
                                {`© ${new Date().getFullYear()} GreenRoute. All rights reserved.`}
                            </p>
                            <div className="flex space-x-6 text-sm">
                                <Link to="/privacy" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">Privacy Policy</Link>
                                <Link to="/terms" className="text-slate-400 hover:text-emerald-400 transition-colors duration-200">Terms of Service</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}

export default Home;