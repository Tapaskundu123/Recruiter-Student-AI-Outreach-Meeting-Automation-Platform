import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Users,
    TrendingUp,
    Target,
    Calendar,
    BarChart3,
    CheckCircle2,
    ArrowRight,
    Star,
    Award,
    Moon,
    Sun
} from 'lucide-react';
import { api } from '../lib/api';

export default function LandingPage() {
    const [isDark, setIsDark] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        university: '',
        major: '',
        graduationYear: '',
        country: '',
        linkedin: '',
        github: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');
    const [waitlistCount, setWaitlistCount] = useState(247);

    // Load theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setIsDark(true);
        }
    }, []);

    // Toggle theme
    const toggleTheme = () => {
        setIsDark(!isDark);
        localStorage.setItem('theme', !isDark ? 'dark' : 'light');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage('');

        try {
            const response = await api.joinWaitlist(formData);

            if (response.data.success) {
                setSubmitMessage('🎉 Welcome to the premium waitlist! Check your email for next steps.');
                setWaitlistCount(prev => prev + 1);
                setFormData({
                    name: '',
                    email: '',
                    university: '',
                    major: '',
                    graduationYear: '',
                    country: '',
                    linkedin: '',
                    github: ''
                });
            }
        } catch (error) {
            setSubmitMessage(error.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 ${isDark
            ? 'bg-gradient-to-br from-gray-950 via-slate-950 to-gray-900'
            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
            } overflow-hidden relative`}>

            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Gradient Orbs */}
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 180, 360],
                        opacity: isDark ? [0.1, 0.15, 0.1] : [0.4, 0.6, 0.4]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl ${isDark
                        ? 'bg-gradient-to-br from-blue-900/20 to-indigo-900/20'
                        : 'bg-gradient-to-br from-blue-400/40 to-indigo-400/40'
                        }`}
                />
                <motion.div
                    animate={{
                        scale: [1.3, 1, 1.3],
                        rotate: [360, 180, 0],
                        opacity: isDark ? [0.12, 0.18, 0.12] : [0.5, 0.7, 0.5]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark
                        ? 'bg-gradient-to-br from-purple-900/15 to-pink-900/15'
                        : 'bg-gradient-to-br from-purple-400/40 to-pink-400/40'
                        }`}
                />
                <motion.div
                    animate={{
                        y: [0, -50, 0],
                        x: [0, 50, 0],
                        opacity: isDark ? [0.08, 0.12, 0.08] : [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className={`absolute top-1/2 left-1/2 w-80 h-80 rounded-full blur-3xl ${isDark
                        ? 'bg-gradient-to-br from-cyan-900/10 to-blue-900/10'
                        : 'bg-gradient-to-br from-cyan-400/30 to-blue-400/30'
                        }`}
                />

                {/* Floating Shapes */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, 50 * (i % 2 ? 1 : -1), 0],
                            rotate: [0, 360],
                            opacity: isDark ? [0.05, 0.1, 0.05] : [0.3, 0.6, 0.3]
                        }}
                        transition={{
                            duration: 10 + i * 2,
                            repeat: Infinity,
                            delay: i * 0.5
                        }}
                        className={`absolute ${isDark ? 'bg-blue-800/5' : 'bg-blue-500/20'
                            } backdrop-blur-sm`}
                        style={{
                            width: 100 + i * 20,
                            height: 100 + i * 20,
                            top: `${10 + i * 15}%`,
                            left: `${5 + i * 15}%`,
                            borderRadius: i % 2 ? '30% 70% 70% 30% / 30% 30% 70% 70%' : '50%',
                        }}
                    />
                ))}

                {/* Grid Pattern */}
                <div
                    className={`absolute inset-0 ${isDark
                        ? 'bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)]'
                        : 'bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)]'
                        } bg-[size:50px_50px]`}
                />
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`fixed top-6 right-6 z-50 p-4 rounded-full shadow-2xl backdrop-blur-xl transition-all ${isDark
                    ? 'bg-slate-800/90 text-yellow-400 hover:bg-slate-700'
                    : 'bg-white/90 text-blue-600 hover:bg-blue-50'
                    } border-2 ${isDark ? 'border-slate-700' : 'border-blue-200'}`}
            >
                <AnimatePresence mode="wait">
                    {isDark ? (
                        <motion.div
                            key="sun"
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            exit={{ rotate: 180, scale: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Sun className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="moon"
                            initial={{ rotate: 180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            exit={{ rotate: -180, scale: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Moon className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${isDark
                                ? 'bg-blue-950/50 border-blue-800 backdrop-blur-xl'
                                : 'bg-blue-600/10 border-blue-200'
                                } mb-6`}
                        >
                            <Star className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            <span className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                Premium Career Acceleration
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${isDark
                                ? 'bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent'
                                : 'bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent'
                                }`}
                        >
                            Land Your Dream Job at
                            <br />
                            <span className={isDark
                                ? 'bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
                            }>
                                Top Tech Companies
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className={`text-xl md:text-2xl max-w-3xl mx-auto mb-8 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'
                                }`}
                        >
                            We optimize your profile, pitch you to hiring managers, and coordinate interviews.
                            <br />
                            Join <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                {waitlistCount}+ students
                            </span> already on the waitlist.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="flex items-center justify-center gap-4 mb-4 flex-wrap"
                        >
                            <div className="flex -space-x-2">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.8 + i * 0.1 }}
                                        className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 flex items-center justify-center text-white text-xs font-bold ${isDark ? 'border-slate-700' : 'border-white'
                                            }`}
                                    >
                                        {String.fromCharCode(65 + i)}
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    </motion.div>
                                ))}
                                <span className={`ml-2 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                    4.9/5 from students
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Premium Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                        {premiumFeatures.map((feature, index) => (
                            <FeatureCard key={index} {...feature} index={index} isDark={isDark} />
                        ))}
                    </div>

                    {/* Waitlist Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border p-8 md:p-12 ${isDark
                            ? 'bg-slate-800/40 border-slate-700/50'
                            : 'bg-white/80 border-white/20'
                            }`}>
                            <div className="text-center mb-8">
                                <motion.div
                                    animate={{
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Award className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                </motion.div>
                                <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Join the Waitlist
                                </h2>
                                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                                    Get early access to our premium career acceleration program
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Full Name *"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                                            : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            }`}
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address *"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                                            : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            }`}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="university"
                                        placeholder="University"
                                        value={formData.university}
                                        onChange={handleChange}
                                        className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                                            : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            }`}
                                    />
                                    <input
                                        type="text"
                                        name="major"
                                        placeholder="Major / Field of Study"
                                        value={formData.major}
                                        onChange={handleChange}
                                        className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                                            : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            }`}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        name="graduationYear"
                                        placeholder="Graduation Year"
                                        value={formData.graduationYear}
                                        onChange={handleChange}
                                        min="2020"
                                        max="2030"
                                        className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                                            : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            }`}
                                    />
                                    <input
                                        type="text"
                                        name="country"
                                        placeholder="Country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className={`px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                            ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                                            : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                            }`}
                                    />
                                </div>

                                <input
                                    type="url"
                                    name="linkedin"
                                    placeholder="LinkedIn Profile URL"
                                    value={formData.linkedin}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                                        : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                        }`}
                                />

                                <input
                                    type="url"
                                    name="github"
                                    placeholder="GitHub Profile URL"
                                    value={formData.github}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all ${isDark
                                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                                        : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                        }`}
                                />

                                {submitMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl ${submitMessage.includes('🎉')
                                            ? isDark
                                                ? 'bg-green-900/30 text-green-300 border border-green-700'
                                                : 'bg-green-50 text-green-700 border border-green-200'
                                            : isDark
                                                ? 'bg-red-900/30 text-red-300 border border-red-700'
                                                : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}
                                    >
                                        {submitMessage}
                                    </motion.div>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={isSubmitting}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Join Premium Waitlist
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </motion.button>

                                <p className={`text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    By joining, you agree to our Terms of Service and Privacy Policy
                                </p>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className={`relative py-12 px-6 border-t backdrop-blur-sm ${isDark
                ? 'border-slate-800 bg-slate-900/50'
                : 'border-slate-200 bg-white/50'
                }`}>
                <div className="max-w-7xl mx-auto text-center">
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                        © 2024 Career Accelerator. All rights reserved.
                    </p>
                    <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Empowering students to land their dream tech jobs
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, badge, index, isDark }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative"
        >
            <div className={`h-full backdrop-blur-sm rounded-2xl p-8 border-2 transition-all shadow-lg hover:shadow-2xl ${isDark
                ? 'bg-slate-800/40 border-slate-700 hover:border-blue-600 hover:bg-slate-800/60'
                : 'bg-white/80 border-slate-100 hover:border-blue-200'
                }`}>
                {/* Badge */}
                <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold shadow-lg">
                        {badge}
                    </span>
                </div>

                {/* Icon */}
                <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg"
                >
                    <Icon className="w-7 h-7 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className={`text-xl font-bold mb-3 transition-colors ${isDark
                    ? 'text-white group-hover:text-blue-400'
                    : 'text-slate-900 group-hover:text-blue-600'
                    }`}>
                    {title}
                </h3>
                <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {description}
                </p>

                {/* Check Icon */}
                <div className={`mt-4 flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-semibold">Included in plan</span>
                </div>
            </div>
        </motion.div>
    );
}

// Premium Features Data
const premiumFeatures = [
    {
        icon: Sparkles,
        title: 'Profile Optimization',
        description: 'Professional resume, LinkedIn, and GitHub enhancement by our expert team. We transform your profile to stand out to hiring managers and recruiters.',
        badge: 'Premium'
    },
    {
        icon: Users,
        title: 'Active Marketing',
        description: 'We pitch your profile directly to hiring managers and recruiters at top tech companies. Our team actively promotes your candidacy to relevant opportunities.',
        badge: 'Premium'
    },
    {
        icon: Calendar,
        title: 'Interview Coordination',
        description: 'We schedule and manage your interview process with interested companies. From initial screening to final rounds, we coordinate everything for you.',
        badge: 'Premium'
    },
    {
        icon: TrendingUp,
        title: 'Placement Tracking',
        description: 'Monitor your marketing campaign progress in real-time. Track which companies viewed your profile, interview requests, and offer status through our dashboard.',
        badge: 'Premium'
    },
    {
        icon: Target,
        title: 'Targeted Filtering',
        description: 'Filter potential contacts by industry, company size, visa sponsorship history, and more to find the perfect match for your skills and career goals.',
        badge: 'Premium'
    },
    {
        icon: BarChart3,
        title: 'Analytics Dashboard',
        description: 'Comprehensive analytics to track your outreach performance, response rates, and conversion metrics with detailed reports and actionable insights.',
        badge: 'Premium'
    }
];