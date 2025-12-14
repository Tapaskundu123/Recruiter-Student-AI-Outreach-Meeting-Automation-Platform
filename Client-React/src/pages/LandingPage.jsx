import { motion } from 'framer-motion';
import { Sparkles, Zap, Users, Calendar, Mail, TrendingUp, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../lib/api.js';
import { toast } from 'sonner';

export default function LandingPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        university: '',
        major: '',
        graduationYear: '',
        country: '',
        linkedin: ''  // Fixed: lowercase 'l'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [waitlistCount, setWaitlistCount] = useState(0);

    useEffect(() => {
        api.getWaitlistCount()
            .then(res => setWaitlistCount(res.data.count))
            .catch(console.error);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await api.joinWaitlist(formData);
            toast.success('Successfully joined the waitlist! 🎉');
            // Reset all fields including linkedin
            setFormData({
                name: '',
                email: '',
                university: '',
                major: '',
                graduationYear: '',
                country: '',
                linkedin: ''
            });
            setWaitlistCount(prev => prev + 1);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join waitlist. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm mb-6"
                        >
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-purple-300">AI-Powered Recruitment Platform</span>
                        </motion.div>

                        <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
                            <span className="text-white">Connect</span>
                            <br />
                            <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                                Recruiters & Students
                            </span>
                            <br />
                            <span className="text-white">Automatically</span>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl text-slate-300 max-w-3xl mx-auto mb-8"
                        >
                            AI-driven outreach, intelligent matching, and automated scheduling.
                            Transform your recruitment process with cutting-edge automation.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center justify-center gap-4 text-sm text-slate-400"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-glow" />
                                <span>{waitlistCount.toLocaleString()}+ on waitlist</span>
                            </div>
                            <span>•</span>
                            <span>Launching Soon</span>
                        </motion.div>
                    </motion.div>

                    {/* Feature Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mb-20">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} index={index} />
                        ))}
                    </div>

                    {/* Waitlist Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="glass-effect rounded-2xl p-8 border-2 border-white/10">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-white mb-2">Join the Waitlist</h2>
                                <p className="text-slate-300">Be among the first to experience the future of recruitment</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name" className="text-white">Full Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email" className="text-white">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                                            placeholder="john@university.edu"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="university" className="text-white">University</Label>
                                        <Input
                                            id="university"
                                            value={formData.university}
                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                                            placeholder="MIT"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="major" className="text-white">Major</Label>
                                        <Input
                                            id="major"
                                            value={formData.major}
                                            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                                            placeholder="Computer Science"
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="graduationYear" className="text-white">Graduation Year</Label>
                                        <Input
                                            id="graduationYear"
                                            type="number"
                                            value={formData.graduationYear}
                                            onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                                            placeholder="2025"
                                            min="2020"
                                            max="2030"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="country" className="text-white">Country</Label>
                                        <Input
                                            id="country"
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                                            placeholder="United States"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1">
                                    <Label htmlFor="linkedin" className="text-white">LinkedIn Profile URL</Label>
                                    <Input
                                        id="linkedin"
                                        type="url"
                                        value={formData.linkedin}
                                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                        className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-slate-400"
                                        placeholder="https://www.linkedin.com/in/johndoe"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 gradient-primary text-white font-semibold text-lg group"
                                >
                                    {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-20 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, index) => (
                            <StatCard key={index} {...stat} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="relative py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                            Three simple steps to revolutionize your recruitment process
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <StepCard key={index} {...step} index={index} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-slate-400">
                        &copy; 2025 AI Outreach Platform. Built for the future of recruitment.
                    </p>
                </div>
            </footer>
        </div>
    );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="glass-effect rounded-xl p-6 border border-white/10 card-hover"
        >
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-300">{description}</p>
        </motion.div>
    );
}

// Stat Card Component
function StatCard({ value, label, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
        >
            <div className="text-5xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                {value}
            </div>
            <div className="text-slate-300 text-sm uppercase tracking-wider">{label}</div>
        </motion.div>
    );
}

// Step Card Component
function StepCard({ step, title, description, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            className="relative"
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xl">
                    {step}
                </div>
                <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
                    <p className="text-slate-300">{description}</p>
                </div>
            </div>
            {index < 2 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent" />
            )}
        </motion.div>
    );
}

// Data
const features = [
    {
        icon: Zap,
        title: 'AI-Powered Scraping',
        description: 'Automatically discover and enrich recruiter and student profiles from multiple sources.'
    },
    {
        icon: Mail,
        title: 'Smart Email Campaigns',
        description: 'Personalized outreach emails generated by AI for maximum engagement and response rates.'
    },
    {
        icon: Calendar,
        title: 'Auto Scheduling',
        description: 'Seamless meeting coordination with Google Calendar integration and automated reminders.'
    }
];

const stats = [
    { value: '10K+', label: 'Users Ready' },
    { value: '95%', label: 'Match Success' },
    { value: '50%', label: 'Time Saved' },
    { value: '24/7', label: 'Automation' }
];

const steps = [
    {
        step: 1,
        title: 'AI Discovers Talent',
        description: 'Our intelligent scrapers find and enrich profiles of recruiters and top students across platforms.'
    },
    {
        step: 2,
        title: 'Personalized Outreach',
        description: 'AI crafts personalized email campaigns tailored to each recipient for better engagement.'
    },
    {
        step: 3,
        title: 'Automated Meetings',
        description: 'Seamlessly schedule meetings with Google Calendar integration and automated confirmations.'
    }
];