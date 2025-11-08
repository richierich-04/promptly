import React, { useState, useRef, useEffect } from 'react';
import { Code2, Bug, TestTube, FileText, Rocket, Sparkles, Twitter, Github, Linkedin } from 'lucide-react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";

// Hero Parallax Component with Framer Motion
const HeroParallax = ({ products }) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig
  );

  return (
    <div
      ref={ref}
      className="h-[300vh] py-40 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      {/* Header Section */}
      <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full left-0 top-0">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          AI Powered Software Development Platform
        </h1>
        <p className="max-w-2xl text-xl md:text-2xl mt-8 text-gray-300">
          Transform your workflow with intelligent agents that code, test, debug, document, and deploy
        </p>
      </div>

      {/* Parallax Cards */}
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-20 space-x-20">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

const ProductCard = ({ product, translate }) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-96 w-[30rem] relative flex-shrink-0"
    >
      <a
        href={product.link}
        className="block group-hover/product:shadow-2xl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={product.thumbnail}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0 rounded-lg"
          alt={product.title}
        />
      </a>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none rounded-lg"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white font-semibold text-xl">
        {product.title}
      </h2>
    </motion.div>
  );
};

// Moving Border Button
const MovingBorderButton = ({ children, className, onClick, style }) => {
  return (
    <button
      onClick={onClick}
      className={`relative px-8 py-3 rounded-lg font-medium transition-all duration-300 ${className}`}
      style={style}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-0 hover:opacity-20 transition-opacity duration-300" />
    </button>
  );
};

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
export default function LandingPage({ onGetStarted }) {
  const products = [
    { title: "Moonbeam", link: "https://gomoonbeam.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/moonbeam.png" },
    { title: "Cursor", link: "https://cursor.so", thumbnail: "https://aceternity.com/images/products/thumbnails/new/cursor.png" },
    { title: "Rogue", link: "https://userogue.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/rogue.png" },
    { title: "Editorially", link: "https://editorially.org", thumbnail: "https://aceternity.com/images/products/thumbnails/new/editorially.png" },
    { title: "Editrix AI", link: "https://editrix.ai", thumbnail: "https://aceternity.com/images/products/thumbnails/new/editrix.png" },
    { title: "Pixel Perfect", link: "https://app.pixelperfect.quest", thumbnail: "https://aceternity.com/images/products/thumbnails/new/pixelperfect.png" },
    { title: "Algochurn", link: "https://algochurn.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/algochurn.png" },
    { title: "Aceternity UI", link: "https://ui.aceternity.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/aceternityui.png" },
    { title: "Tailwind Master Kit", link: "https://tailwindmasterkit.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/tailwindmasterkit.png" },
    { title: "SmartBridge", link: "https://smartbridgetech.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/smartbridge.png" },
    { title: "Renderwork Studio", link: "https://renderwork.studio", thumbnail: "https://aceternity.com/images/products/thumbnails/new/renderwork.png" },
    { title: "Creme Digital", link: "https://cremedigital.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/cremedigital.png" },
    { title: "Golden Bells Academy", link: "https://goldenbellsacademy.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/goldenbellsacademy.png" },
    { title: "Invoker Labs", link: "https://invoker.lol", thumbnail: "https://aceternity.com/images/products/thumbnails/new/invoker.png" },
    { title: "E Free Invoice", link: "https://efreeinvoice.com", thumbnail: "https://aceternity.com/images/products/thumbnails/new/efreeinvoice.png" }
  ];

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
          
          <MovingBorderButton 
            onClick={onGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 hover:shadow-lg"
          >
            Get Started
          </MovingBorderButton>
        </header>

        {/* Hero Section with Parallax */}
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
                <AgentCard 
                    icon={<TestTube className="w-8 h-8" />} 
                    title="Ideation Agent" 
                    description="Turns raw ideas into actionable project concepts." 
                    delay={0} 
                />

                <AgentCard 
                    icon={<Code2 className="w-8 h-8" />} 
                    title="Coding Agent" 
                    description="Writes and optimizes clean, efficient code." 
                    delay={0.1} 
                />

                <AgentCard 
                    icon={<Bug className="w-8 h-8" />} 
                    title="Debugging Agent" 
                    description="Finds and fixes code errors instantly." 
                    delay={0.2} 
                />

                <AgentCard 
                    icon={<FileText className="w-8 h-8" />} 
                    title="Documentation Agent" 
                    description="Creates clear and concise documentation." 
                    delay={0.3} 
                />

                <AgentCard 
                    icon={<Rocket className="w-8 h-8" />} 
                    title="Testing Agent" 
                    description="Runs tests to ensure code stability." 
                    delay={0.4} 
                />
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
                onClick={onGetStarted}
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