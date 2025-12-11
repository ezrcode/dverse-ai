'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    MessageSquare,
    Zap,
    Shield,
    GitBranch,
    FileText,
    Database,
    ArrowRight,
    Check,
    Github,
    ExternalLink,
    Sparkles,
    Clock,
    Users,
    Code2,
    Search,
    Map,
    BarChart3,
    History,
    Layers,
} from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();
    const [typedText, setTypedText] = useState('');
    const fullText = 'What entities are related to Contact?';

    useEffect(() => {
        // Redirect if already logged in
        if (ApiClient.hasToken()) {
            router.push('/');
            return;
        }

        // Typing animation
        let i = 0;
        const timer = setInterval(() => {
            if (i < fullText.length) {
                setTypedText(fullText.slice(0, i + 1));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 50);

        return () => clearInterval(timer);
    }, [router]);

    const features = [
        { icon: Search, title: 'Natural Language Queries', desc: 'Ask questions about your metadata in plain English or Spanish' },
        { icon: Map, title: 'Dependency Mapping', desc: 'Understand relationships between entities, fields, and components' },
        { icon: BarChart3, title: 'Impact Analysis', desc: 'Know what breaks before you make changes' },
        { icon: FileText, title: 'Auto Documentation', desc: 'Generate technical docs from your actual configuration' },
        { icon: History, title: 'Conversation History', desc: 'Track and revisit past queries and discoveries' },
        { icon: Layers, title: 'Multi-Environment', desc: 'Connect and analyze multiple D365 instances' },
    ];

    const painPoints = [
        { icon: Clock, text: 'Developers spend 30%+ of time understanding existing customizations' },
        { icon: FileText, text: 'Documentation is always outdated or missing' },
        { icon: Shield, text: 'Fear of breaking things when making changes' },
        { icon: Users, text: 'Slow onboarding for new team members' },
    ];

    const steps = [
        { num: '01', title: 'Connect', desc: 'Link your Dynamics 365 environment in 5 minutes with Azure AD credentials' },
        { num: '02', title: 'Ask', desc: 'Query your metadata in natural language - entities, fields, workflows, anything' },
        { num: '03', title: 'Understand', desc: 'Get instant answers with context, dependencies, and actionable insights' },
    ];

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FF6B47] rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-[#1A1A1A]">DVerse<span className="text-[#FF6B47]">-ai</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://github.com/ezrcode/dverse-ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:flex items-center gap-2 text-[#666] hover:text-[#1A1A1A] transition-colors"
                        >
                            <Github className="w-5 h-5" />
                            <span className="text-sm">GitHub</span>
                        </a>
                        <Link
                            href="/login"
                            className="px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:text-[#FF6B47] transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2.5 bg-[#FF6B47] text-white text-sm font-medium rounded-lg hover:bg-[#E55A3A] transition-colors"
                        >
                            Start Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B47]/10 rounded-full">
                                <Sparkles className="w-4 h-4 text-[#FF6B47]" />
                                <span className="text-sm font-medium text-[#FF6B47]">Open Source · MIT License</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight">
                                Understand Your{' '}
                                <span className="text-[#FF6B47]">Dynamics 365</span>{' '}
                                in Seconds, Not Hours
                            </h1>

                            <p className="text-lg text-[#666] leading-relaxed max-w-xl">
                                AI-powered intelligence that reads your Dataverse metadata and answers your questions in natural language. 
                                Like Cursor for code, but for your D365 configuration.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF6B47] text-white font-medium rounded-lg hover:bg-[#E55A3A] transition-colors"
                                >
                                    Start Free Trial
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <a
                                    href="https://github.com/ezrcode/dverse-ai"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-[#E5E5E5] text-[#1A1A1A] font-medium rounded-lg hover:border-[#FF6B47] hover:text-[#FF6B47] transition-colors"
                                >
                                    <Github className="w-5 h-5" />
                                    View on GitHub
                                </a>
                            </div>

                            <p className="text-sm text-[#999]">
                                No credit card required · Connect in under 5 minutes
                            </p>
                        </div>

                        {/* Hero Visual - Chat Preview */}
                        <div className="relative">
                            <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E5E5] overflow-hidden">
                                {/* Header */}
                                <div className="bg-[#1A1A1A] px-6 py-4 flex items-center gap-3">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                        <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                                    </div>
                                    <span className="text-white/60 text-sm ml-4">DVerse-ai · Production Environment</span>
                                </div>

                                {/* Chat Content */}
                                <div className="p-6 space-y-4 min-h-[300px]">
                                    {/* User Message */}
                                    <div className="flex justify-end">
                                        <div className="bg-[#F0F0F0] rounded-lg px-4 py-3 max-w-[80%]">
                                            <p className="text-[#1A1A1A] text-sm">
                                                {typedText}
                                                <span className="animate-pulse">|</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* AI Response */}
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 bg-[#FF6B47] rounded-full flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-white border border-[#E5E5E5] rounded-lg px-4 py-3 max-w-[85%]">
                                            <p className="text-[#1A1A1A] text-sm leading-relaxed">
                                                The <code className="bg-[#F5F5F5] px-1 rounded text-[#FF6B47]">contact</code> entity has <strong>12 relationships</strong>:
                                            </p>
                                            <ul className="mt-2 space-y-1 text-sm text-[#666]">
                                                <li>→ <code className="text-[#FF6B47]">account</code> (N:1 - Parent Customer)</li>
                                                <li>→ <code className="text-[#FF6B47]">opportunity</code> (1:N - Primary Contact)</li>
                                                <li>→ <code className="text-[#FF6B47]">case</code> (1:N - Customer)</li>
                                                <li className="text-[#999]">+ 9 more relationships...</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Input */}
                                <div className="px-6 pb-6">
                                    <div className="flex items-center gap-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg px-4 py-3">
                                        <MessageSquare className="w-5 h-5 text-[#999]" />
                                        <span className="text-[#999] text-sm">Ask DVerse-ai about metadata...</span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -z-10 top-8 -right-8 w-64 h-64 bg-[#FF6B47]/10 rounded-full blur-3xl"></div>
                            <div className="absolute -z-10 -bottom-8 -left-8 w-48 h-48 bg-[#FF6B47]/5 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pain Points */}
            <section className="py-20 px-6 bg-white border-y border-[#E5E5E5]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">The Problem with Complex D365 Systems</h2>
                        <p className="text-[#666] max-w-2xl mx-auto">
                            After years of customizations, your Dynamics 365 becomes a black box. Sound familiar?
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {painPoints.map((point, i) => (
                            <div key={i} className="p-6 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5]">
                                <point.icon className="w-8 h-8 text-[#FF6B47] mb-4" />
                                <p className="text-[#1A1A1A] font-medium">{point.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">How It Works</h2>
                        <p className="text-[#666]">Get started in three simple steps</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((step, i) => (
                            <div key={i} className="relative">
                                <div className="text-6xl font-bold text-[#FF6B47]/10 absolute -top-4 -left-2">{step.num}</div>
                                <div className="relative bg-white rounded-xl p-8 border border-[#E5E5E5] shadow-sm">
                                    <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">{step.title}</h3>
                                    <p className="text-[#666]">{step.desc}</p>
                                </div>
                                {i < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                                        <ArrowRight className="w-8 h-8 text-[#E5E5E5]" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6 bg-white border-y border-[#E5E5E5]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Key Features</h2>
                        <p className="text-[#666] max-w-2xl mx-auto">
                            Everything you need to understand and document your Dynamics 365 environment
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div key={i} className="p-6 bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] hover:border-[#FF6B47] transition-colors group">
                                <div className="w-12 h-12 bg-[#FF6B47]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FF6B47] transition-colors">
                                    <feature.icon className="w-6 h-6 text-[#FF6B47] group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">{feature.title}</h3>
                                <p className="text-[#666] text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Built for D365 Professionals</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-xl p-8 border border-[#E5E5E5]">
                            <Code2 className="w-10 h-10 text-[#FF6B47] mb-4" />
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">For Developers</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Onboard to new projects 10x faster
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Understand legacy customizations
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Find dependencies before changes
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl p-8 border border-[#E5E5E5]">
                            <Users className="w-10 h-10 text-[#FF6B47] mb-4" />
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">For Consultants</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Audit client instances instantly
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Generate technical documentation
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Analyze multiple environments
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl p-8 border border-[#E5E5E5]">
                            <Shield className="w-10 h-10 text-[#FF6B47] mb-4" />
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">For Admins</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Know what breaks before you change
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Track all customizations
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    Maintain system health
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 px-6 bg-white border-y border-[#E5E5E5]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-[#666]">Start free, upgrade when you need more</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free */}
                        <div className="bg-[#FAFAFA] rounded-xl p-8 border border-[#E5E5E5]">
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Free</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-[#1A1A1A]">$0</span>
                                <span className="text-[#666]">/month</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    100 queries/month
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    1 environment
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    7-day history
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    BYOK (Bring Your Own Key)
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="block text-center px-6 py-3 border border-[#E5E5E5] text-[#1A1A1A] font-medium rounded-lg hover:border-[#FF6B47] hover:text-[#FF6B47] transition-colors"
                            >
                                Get Started Free
                            </Link>
                        </div>

                        {/* Pro */}
                        <div className="bg-[#1A1A1A] rounded-xl p-8 border-2 border-[#FF6B47] relative">
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#FF6B47] text-white text-xs font-medium px-3 py-1 rounded-full">
                                Most Popular
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">$9</span>
                                <span className="text-white/60">/month</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-white/80">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    1,000 queries/month
                                </li>
                                <li className="flex items-center gap-2 text-white/80">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    5 environments
                                </li>
                                <li className="flex items-center gap-2 text-white/80">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    Unlimited history
                                </li>
                                <li className="flex items-center gap-2 text-white/80">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    Export features
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="block text-center px-6 py-3 bg-[#FF6B47] text-white font-medium rounded-lg hover:bg-[#E55A3A] transition-colors"
                            >
                                Start Pro Trial
                            </Link>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-[#FAFAFA] rounded-xl p-8 border border-[#E5E5E5]">
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Enterprise</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-[#1A1A1A]">Custom</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    Unlimited queries
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    Unlimited environments
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    SSO + Priority Support
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    API Access
                                </li>
                            </ul>
                            <a
                                href="mailto:contact@ezrcode.com"
                                className="block text-center px-6 py-3 border border-[#E5E5E5] text-[#1A1A1A] font-medium rounded-lg hover:border-[#FF6B47] hover:text-[#FF6B47] transition-colors"
                            >
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">Built with Modern Tech</h2>
                    <p className="text-[#666] mb-12">Open source and built on proven technologies</p>

                    <div className="flex flex-wrap justify-center gap-6 mb-12">
                        {['Next.js', 'NestJS', 'PostgreSQL', 'Google Gemini', 'TypeScript', 'Tailwind CSS'].map((tech) => (
                            <div key={tech} className="px-6 py-3 bg-white rounded-lg border border-[#E5E5E5] text-[#1A1A1A] font-medium">
                                {tech}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="https://github.com/ezrcode/dverse-ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm hover:bg-[#333] transition-colors"
                        >
                            <Github className="w-4 h-4" />
                            Star on GitHub
                        </a>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-sm text-[#666]">
                            MIT License
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 px-6 bg-[#1A1A1A]">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Start Analyzing Your Dataverse Today
                    </h2>
                    <p className="text-white/60 text-lg mb-8">
                        Connect your Dynamics 365 environment in under 5 minutes. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF6B47] text-white font-medium rounded-lg hover:bg-[#E55A3A] transition-colors text-lg"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 bg-[#FAFAFA] border-t border-[#E5E5E5]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#FF6B47] rounded-lg flex items-center justify-center">
                                <Database className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-[#1A1A1A]">DVerse<span className="text-[#FF6B47]">-ai</span></span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-[#666]">
                            <a href="https://github.com/ezrcode/dverse-ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6B47] transition-colors flex items-center gap-1">
                                <Github className="w-4 h-4" />
                                GitHub
                            </a>
                            <span>·</span>
                            <span>by <a href="https://github.com/ezrcode" target="_blank" rel="noopener noreferrer" className="text-[#FF6B47] hover:underline">@ezrcode</a></span>
                        </div>

                        <p className="text-sm text-[#999]">
                            © {new Date().getFullYear()} DVerse-ai. MIT License.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

