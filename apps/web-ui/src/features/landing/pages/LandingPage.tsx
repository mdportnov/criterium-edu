import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  BookOpen, 
  CheckCircle2, 
  Code2, 
  Users, 
  Zap, 
  ArrowRight,
  Shield,
  Target,
  TrendingUp,
  Award
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Criterium EDU" className="w-8 h-8" />
              <span className="text-xl font-bold text-blue-900">Criterium EDU</span>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Educational Platform for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Excellence
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Criterium EDU is a comprehensive educational assessment platform designed for automated task evaluation, 
            code checking, and structured review processes. Built for educators and administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link to="/register">
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link to="/login">Access Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Task Management</h3>
            <p className="text-gray-600">
              Create, organize, and manage educational tasks with comprehensive criteria and automated assessment capabilities.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Code Checker</h3>
            <p className="text-gray-600">
              Advanced code validation system with real-time feedback, syntax checking, and automated testing capabilities.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Automated Reviews</h3>
            <p className="text-gray-600">
              Intelligent assessment system with both automated and manual review processes for comprehensive evaluation.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">
              Comprehensive analytics and reporting tools to track progress, performance metrics, and system utilization.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bulk Operations</h3>
            <p className="text-gray-600">
              Efficient bulk import and export capabilities for managing large datasets and streamlining administrative tasks.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Role-Based Access</h3>
            <p className="text-gray-600">
              Secure role-based permissions system ensuring appropriate access levels for administrators, reviewers, and students.
            </p>
          </Card>
        </div>

        {/* Statistics Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 mb-16 border border-blue-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">System Overview</h2>
            <p className="text-gray-600">Built for educational excellence and scalable assessment</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">Tasks</div>
              <div className="text-gray-600">Management</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">Real-time</div>
              <div className="text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">Quality</div>
              <div className="text-gray-600">Assessment</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">Analytics</div>
              <div className="text-gray-600">Insights</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join educational institutions leveraging Criterium EDU for comprehensive assessment management.
          </p>
          <Button asChild size="lg" className="px-8">
            <Link to="/register">
              Create Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-blue-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <img src="/logo.svg" alt="Criterium EDU" className="w-6 h-6" />
              <span className="text-sm text-gray-600">
                © {new Date().getFullYear()} Criterium EDU. Educational Platform for Excellence.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <Link to="/login" className="hover:text-blue-600 transition-colors">
                Login
              </Link>
              <Link to="/register" className="hover:text-blue-600 transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;