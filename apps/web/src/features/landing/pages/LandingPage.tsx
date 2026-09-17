import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Code2,
  Shield,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Task management',
    description:
      'Create, organize, and manage educational tasks with comprehensive criteria and automated assessment capabilities.',
  },
  {
    icon: Code2,
    title: 'Code checker',
    description:
      'Advanced code validation with real-time feedback, syntax checking, and automated testing.',
  },
  {
    icon: CheckCircle2,
    title: 'Automated reviews',
    description:
      'Intelligent assessment with both automated and manual review processes for comprehensive evaluation.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics dashboard',
    description:
      'Comprehensive analytics and reporting to track progress, performance, and system utilization.',
  },
  {
    icon: Users,
    title: 'Bulk operations',
    description:
      'Efficient bulk import and export for managing large datasets and streamlining administrative tasks.',
  },
  {
    icon: Shield,
    title: 'Role-based access',
    description:
      'Secure role-based permissions ensuring appropriate access for administrators, reviewers, and students.',
  },
];

const STATS = [
  { icon: Target, label: 'Tasks', value: 'Management' },
  { icon: Zap, label: 'Real-time', value: 'Processing' },
  { icon: Award, label: 'Quality', value: 'Assessment' },
  { icon: TrendingUp, label: 'Analytics', value: 'Insights' },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="size-6" aria-hidden="true" />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Criterium EDU
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            An assessment platform built for educational excellence
          </h1>
          <p className="mt-4 text-[15px] leading-6 text-muted-foreground">
            Criterium EDU is a comprehensive educational assessment platform
            designed for automated task evaluation, code checking, and
            structured review processes. Built for educators and administrators.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/register">
                Start your journey
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Access dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="p-5">
              <feature.icon
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-[13px] font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-16 rounded-md border border-border bg-card p-8">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              System overview
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Built for educational excellence and scalable assessment.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon
                  className="mx-auto size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="mt-2.5 text-[15px] font-semibold text-foreground">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Ready to get started?
          </h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Join educational institutions leveraging Criterium EDU for
            comprehensive assessment management.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/register">
              Create account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="size-5" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Criterium EDU. Educational platform
              for excellence.
            </span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
