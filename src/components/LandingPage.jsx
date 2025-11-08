import React, { useState, useRef, useEffect } from 'react';
import { Code2, Bug, TestTube, FileText, Rocket, Sparkles, Twitter, Github, Linkedin, X } from 'lucide-react';

// Simple Dialog Component
const Dialog = ({ children, open, onOpenChange }) => {
  return (
    <>
      {React.Children.map(children, child => {
        if (child.type === DialogTrigger) {
          return React.cloneElement(child, { onClick: () => onOpenChange(true) });
        }
        if (child.type === DialogContent && open) {
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                {child}
              </div>
            </div>
          );
        }
        return null;
      })}
    </>
  );
};

const DialogTrigger = ({ children, onClick }) => {
  return React.cloneElement(children, { onClick });
};

const DialogContent = ({ children, className }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const DialogHeader = ({ children, className }) => <div className={className}>{children}</div>;
const DialogTitle = ({ children, className }) => <h2 className={className}>{children}</h2>;
const DialogDescription = ({ children }) => <p className="text-gray-400 text-sm">{children}</p>;

// Hero Parallax Component
const HeroParallax = ({ products }) => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const transform = Math.min(scrollY / 3, 100);

  return (
    <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${transform}px)` }}>
        <div className="grid grid-cols-3 gap-4 p-4 opacity-20 blur-sm">
          {products.slice(0, 9).map((product, idx) => (
            <div key={idx} className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
              <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-5xl">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          AI-Powered Development Platform
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8">
          Transform your workflow with intelligent agents that code, test, debug, document, and deploy
        </p>
      </div>
    </div>
  );
};

// Moving Border Button
const MovingBorderButton = ({ children, className, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative px-8 py-3 rounded-lg font-medium transition-all duration-300 ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-0 hover:opacity-20 transition-opacity duration-300" />
    </button>
  );
};

// Google Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.242,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

// Agent Card Component
const AgentCard = ({ icon, title, description, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`relative p-px overflow-hidden rounded-xl transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
    >
      <div className="relative p-6 bg-gray-900/80 backdrop-blur-sm rounded-xl text-center flex flex-col items-center h-full border border-gray-800 hover:border-purple-500 transition-all duration-300">
        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20" style={{ boxShadow: '0 0 15px -2px rgba(168, 85, 247, 0.3)' }}>
          <div className="text-purple-400">{icon}</div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p className="text-gray-400 text-sm flex-grow">{description}</p>
      </div>
    </div>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-transparent border-t border-transparent relative z-20">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <a href="/" className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold text-white">Neon Board</span>
            </a>
            <p className="text-gray-400 text-sm">AI Agent Team Collaboration for Software Development</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 col-span-3 gap-8">
            <div>
              <h4 className="font-semibold mb-3 text-white">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Neon Board. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-purple-400 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" aria-label="GitHub" className="text-gray-400 hover:text-purple-400 transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-purple-400 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page Component
export default function LandingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const products = [
    { title: "Moonbeam", link: "https://gomoonbeam.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/moonbeam.png" },
    { title: "Cursor", link: "https://cursor.so", thumbnail: "https://aceternity.com/images/products/thumbnails/new/cursor.png" },
    { title: "Rogue", link: "https://userogue.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/rogue.png" },
    { title: "Editorially", link: "https://editorially.org", thumbnail: "https://aceternity.com/images/products/thumbnails/new/editorially.png" },
    { title: "Editrix AI", link: "https://editrix.ai", thumbnail: "https://aceternity.com/images/products/thumbnails/new/editrix.png" },
    { title: "Pixel Perfect", link: "https://app.pixelperfect.quest", thumbnail: "https://aceternity.com/images/products/thumbnails/new/pixelperfect.png" },
    { title: "Algochurn", link: "https://algochurn.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/algochurn.png" },
    { title: "Aceternity UI", link: "https://ui.aceternity.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/aceternityui.png" },
    { title: "Tailwind Master Kit", link: "https://tailwindmasterkit.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/tailwindmasterkit.png" }
  ];

  const handleSignIn = (e) => {
    e.preventDefault();
    alert('Email/password sign in not implemented yet.');
  };

  const handleOAuth = (provider) => {
    alert(`${provider} OAuth not implemented yet. This would integrate with Firebase.`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8))' }}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 max-w-7xl mx-auto">
          <a href="/" className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold text-white">Neon Board</span>
          </a>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <MovingBorderButton className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 hover:shadow-lg">
                Get Started
              </MovingBorderButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg p-0 overflow-hidden">
              <div className="relative p-8">
                <button
                  onClick={() => setDialogOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-400 opacity-20" style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }} />
                <div className="relative">
                  <DialogHeader className="text-center items-center mb-6">
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
                      Welcome to Neon Board
                    </DialogTitle>
                    <DialogDescription>
                      Sign in to your account to continue.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm text-gray-300">Email</label>
                      <input
                        id="email"
                        type="email"
                        placeholder="alex@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm text-gray-300">Password</label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleSignIn}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-md hover:scale-105 hover:shadow-lg transition-all duration-300"
                    >
                      Sign In
                    </button>
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => handleOAuth('google')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white hover:bg-gray-700 transition-colors"
                    >
                      <GoogleIcon />
                      Continue with Google
                    </button>
                    <button
                      onClick={() => handleOAuth('github')}
                      className="w-full flex items-center justify-center px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white hover:bg-gray-700 transition-colors"
                    >
                      <Github className="mr-2 h-5 w-5" />
                      Continue with GitHub
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* Hero Section */}
        <HeroParallax products={products} />

        {/* Agents Section */}
        <div className="bg-transparent relative z-20">
          <div className="container mx-auto px-4 py-20 md:py-32 max-w-7xl">
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Introducing Our Agents
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Our platform brings specialized AI agents together to streamline every step of your build process.
              </p>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              <AgentCard icon={<Code2 className="w-8 h-8" />} title="Coding Agent" description="Writes and optimizes your code in real time." delay={0} />
              <AgentCard icon={<TestTube className="w-8 h-8" />} title="Testing Agent" description="Automates test creation, execution, and reporting." delay={0.1} />
              <AgentCard icon={<Bug className="w-8 h-8" />} title="Debugging Agent" description="Finds and fixes bugs with intelligent recommendations." delay={0.2} />
              <AgentCard icon={<FileText className="w-8 h-8" />} title="Documentation Agent" description="Generates clear, developer-friendly docs instantly." delay={0.3} />
              <AgentCard icon={<Rocket className="w-8 h-8" />} title="Deployment Agent" description="Pushes your project live with seamless CI/CD support." delay={0.4} />
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center container mx-auto px-4 pb-20 md:pb-32 max-w-7xl">
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Build Faster. Collaborate Smarter.
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Let AI agents handle the heavy lifting, so you can focus on innovation.
            </p>
            <div className="mt-8">
              <MovingBorderButton
                onClick={() => setDialogOpen(true)}
                className="bg-purple-600/90 text-white hover:bg-purple-600 transition-all duration-300"
                style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
              >
                Get Started Free
              </MovingBorderButton>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}