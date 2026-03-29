import { GraduationCap, Users, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-up">
            <GraduationCap className="w-4 h-4" />
            <span>Streamlined Campus Placement System</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-up" style={{ animationDelay: '100ms' }}>
            Your Gateway to{' '}
            <span className="gradient-text">Dream Career</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '200ms' }}>
            Automated eligibility analysis, transparent placement drives, and seamless 
            coordination between students and administrators.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Button 
              variant="hero" 
              size="xl" 
              onClick={() => navigate('/student-login')}
              className="group"
            >
              <GraduationCap className="w-5 h-5" />
              I'm a Student
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              variant="glass" 
              size="xl" 
              onClick={() => navigate('/admin-login')}
              className="group"
            >
              <Users className="w-5 h-5" />
              I'm an Admin
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-up" style={{ animationDelay: '400ms' }}>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold font-display text-foreground">500+</div>
            <div className="text-muted-foreground">Students Registered</div>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-accent" />
            </div>
            <div className="text-3xl font-bold font-display text-foreground">50+</div>
            <div className="text-muted-foreground">Companies Hiring</div>
          </div>
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div className="text-3xl font-bold font-display text-foreground">85%</div>
            <div className="text-muted-foreground">Placement Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
