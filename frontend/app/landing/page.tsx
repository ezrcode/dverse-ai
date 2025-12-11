'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
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
    Globe,
} from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();
    const { t, lang, setLang } = useI18n();
    const [typedText, setTypedText] = useState('');
    const fullTextEs = '¿Qué entidades están relacionadas con Contact?';
    const fullTextEn = 'What entities are related to Contact?';
    const fullText = lang === 'es' ? fullTextEs : fullTextEn;

    useEffect(() => {
        // Redirect if already logged in
        if (ApiClient.hasToken()) {
            router.push('/');
            return;
        }

        // Typing animation
        setTypedText('');
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
    }, [router, lang, fullText]);

    const features = [
        { icon: Search, title: t('landing_feature1'), desc: t('landing_feature1Desc') },
        { icon: Map, title: t('landing_feature2'), desc: t('landing_feature2Desc') },
        { icon: BarChart3, title: t('landing_feature3'), desc: t('landing_feature3Desc') },
        { icon: FileText, title: t('landing_feature4'), desc: t('landing_feature4Desc') },
        { icon: History, title: t('landing_feature5'), desc: t('landing_feature5Desc') },
        { icon: Layers, title: t('landing_feature6'), desc: t('landing_feature6Desc') },
    ];

    const painPoints = [
        { icon: Clock, text: t('landing_pain1') },
        { icon: FileText, text: t('landing_pain2') },
        { icon: Shield, text: t('landing_pain3') },
        { icon: Users, text: t('landing_pain4') },
    ];

    const steps = [
        { num: '01', title: t('landing_step1Title'), desc: t('landing_step1Desc') },
        { num: '02', title: t('landing_step2Title'), desc: t('landing_step2Desc') },
        { num: '03', title: t('landing_step3Title'), desc: t('landing_step3Desc') },
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
                        {/* Language Selector */}
                        <div className="flex items-center gap-1 text-sm">
                            <Globe className="w-4 h-4 text-[#666]" />
                            <button
                                onClick={() => setLang('es')}
                                className={`px-2 py-1 rounded ${lang === 'es' ? 'text-[#FF6B47] font-medium' : 'text-[#666] hover:text-[#1A1A1A]'}`}
                            >
                                ES
                            </button>
                            <span className="text-[#E5E5E5]">|</span>
                            <button
                                onClick={() => setLang('en')}
                                className={`px-2 py-1 rounded ${lang === 'en' ? 'text-[#FF6B47] font-medium' : 'text-[#666] hover:text-[#1A1A1A]'}`}
                            >
                                EN
                            </button>
                        </div>
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
                            {t('landing_login')}
                        </Link>
                        <Link
                            href="/register"
                            className="px-5 py-2.5 bg-[#FF6B47] text-white text-sm font-medium rounded-lg hover:bg-[#E55A3A] transition-colors"
                        >
                            {t('landing_startFree')}
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
                                <span className="text-sm font-medium text-[#FF6B47]">{t('landing_openSource')}</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A1A1A] leading-tight">
                                {t('landing_headline')}
                            </h1>

                            <p className="text-lg text-[#666] leading-relaxed max-w-xl">
                                {t('landing_subheadline')}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF6B47] text-white font-medium rounded-lg hover:bg-[#E55A3A] transition-colors"
                                >
                                    {t('landing_startFree')}
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                                <a
                                    href="https://github.com/ezrcode/dverse-ai"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-[#E5E5E5] text-[#1A1A1A] font-medium rounded-lg hover:border-[#FF6B47] hover:text-[#FF6B47] transition-colors"
                                >
                                    <Github className="w-5 h-5" />
                                    {t('landing_viewGithub')}
                                </a>
                            </div>

                            <p className="text-sm text-[#999]">
                                {t('landing_noCreditCard')}
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
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">{t('landing_problemTitle')}</h2>
                        <p className="text-[#666] max-w-2xl mx-auto">
                            {t('landing_problemSubtitle')}
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
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">{t('landing_howItWorks')}</h2>
                        <p className="text-[#666]">{t('landing_howItWorksSubtitle')}</p>
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
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">{t('landing_featuresTitle')}</h2>
                        <p className="text-[#666] max-w-2xl mx-auto">
                            {t('landing_featuresSubtitle')}
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
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">{t('landing_useCasesTitle')}</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-xl p-8 border border-[#E5E5E5]">
                            <Code2 className="w-10 h-10 text-[#FF6B47] mb-4" />
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">{t('landing_forDevs')}</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_dev1')}
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_dev2')}
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_dev3')}
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl p-8 border border-[#E5E5E5]">
                            <Users className="w-10 h-10 text-[#FF6B47] mb-4" />
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">{t('landing_forConsultants')}</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_consultant1')}
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_consultant2')}
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_consultant3')}
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl p-8 border border-[#E5E5E5]">
                            <Shield className="w-10 h-10 text-[#FF6B47] mb-4" />
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">{t('landing_forAdmins')}</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_admin1')}
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_admin2')}
                                </li>
                                <li className="flex items-start gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47] flex-shrink-0 mt-0.5" />
                                    {t('landing_admin3')}
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
                        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">{t('landing_pricingTitle')}</h2>
                        <p className="text-[#666]">{t('landing_pricingSubtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free */}
                        <div className="bg-[#FAFAFA] rounded-xl p-8 border border-[#E5E5E5]">
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{t('landing_free')}</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-[#1A1A1A]">$0</span>
                                <span className="text-[#666]">{t('landing_month')}</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    100 {t('landing_queriesMonth')}
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    1 {t('landing_environments')}
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    7 {t('landing_history')}
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    {t('landing_byok')}
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="block text-center px-6 py-3 border border-[#E5E5E5] text-[#1A1A1A] font-medium rounded-lg hover:border-[#FF6B47] hover:text-[#FF6B47] transition-colors"
                            >
                                {t('landing_getStartedFree')}
                            </Link>
                        </div>

                        {/* Pro */}
                        <div className="bg-[#1A1A1A] rounded-xl p-8 border-2 border-[#FF6B47] relative">
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#FF6B47] text-white text-xs font-medium px-3 py-1 rounded-full">
                                {t('landing_mostPopular')}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t('landing_pro')}</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-white">$9</span>
                                <span className="text-white/60">{t('landing_month')}</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-white/80">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    1,000 {t('landing_queriesMonth')}
                                </li>
                                <li className="flex items-center gap-2 text-white/80">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    5 {t('landing_environments')}
                                </li>
                                <li className="flex items-center gap-2 text-white/80">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    {t('landing_unlimited')} {t('landing_history')}
                                </li>
                                <li className="flex items-center gap-2 text-white/80">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    {t('landing_export')}
                                </li>
                            </ul>
                            <Link
                                href="/register"
                                className="block text-center px-6 py-3 bg-[#FF6B47] text-white font-medium rounded-lg hover:bg-[#E55A3A] transition-colors"
                            >
                                {t('landing_startProTrial')}
                            </Link>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-[#FAFAFA] rounded-xl p-8 border border-[#E5E5E5]">
                            <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{t('landing_enterprise')}</h3>
                            <div className="mb-6">
                                <span className="text-4xl font-bold text-[#1A1A1A]">{t('landing_custom')}</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    {t('landing_unlimited')} {t('landing_queriesMonth')}
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    {t('landing_unlimited')} {t('landing_environments')}
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    {t('landing_sso')}
                                </li>
                                <li className="flex items-center gap-2 text-[#666]">
                                    <Check className="w-5 h-5 text-[#FF6B47]" />
                                    {t('landing_api')}
                                </li>
                            </ul>
                            <a
                                href="mailto:contact@ezrcode.com"
                                className="block text-center px-6 py-3 border border-[#E5E5E5] text-[#1A1A1A] font-medium rounded-lg hover:border-[#FF6B47] hover:text-[#FF6B47] transition-colors"
                            >
                                {t('landing_contactUs')}
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">{t('landing_techTitle')}</h2>
                    <p className="text-[#666] mb-12">{t('landing_techSubtitle')}</p>

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
                            {t('landing_starOnGithub')}
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
                        {t('landing_finalCta')}
                    </h2>
                    <p className="text-white/60 text-lg mb-8">
                        {t('landing_finalCtaSubtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF6B47] text-white font-medium rounded-lg hover:bg-[#E55A3A] transition-colors text-lg"
                        >
                            {t('landing_getStartedFree')}
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

