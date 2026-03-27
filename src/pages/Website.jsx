import React, { useState, useEffect } from 'react';
import { ChevronRight, Server, Globe, Shield, Zap, Menu, X, ChevronDown, CircleCheck, ExternalLink } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings } = useSettings();
  const siteName = settings?.name || "Heliactyl";
  const consoleUrl = settings?.console || "https://console.heliactyl.toledo";

  // Handle scroll events to update navbar style
  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = document.getElementById('hero')?.offsetHeight || 0;
      setScrolled(window.scrollY > heroHeight - 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#101218] text-white transition-colors duration-200">
      {/* Fixed Status bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-t from-[#101218] to-[#111215] border-b border-white/5 shadow py-2 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xs text-[#95a1ad]">
            <a href="mailto:support@heliactyl.toledo" className="hover:text-white transition">help@{settings?.name.toLowerCase() || 'heliactyl'}.toledo</a>
            <span className="mx-2">|</span>
            <a href="tel:+15615710232" className="hover:text-white transition">+1 (561) 571-0232</a>
          </div>
          <a
            href={`https://status.${settings?.name.toLowerCase() || 'heliactyl'}.toledo`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-xs text-[#95a1ad] hover:text-white transition"
          >
            <CircleCheck className="h-3 w-3 mr-1 text-green-500" />
            Systems operational
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>

      {/* Floating Navbar - positioned below status bar */}
      <header className={`fixed top-8 left-0 right-0 z-40 px-6 py-4 transition-all duration-300 ${scrolled
        ? 'bg-[#101218]/50 border-b border-white/5 backdrop-blur shadow-md'
        : 'bg-gradient-to-b from-[#101218]/15 to-transparent'
        }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={settings?.logo || "https://i.imgur.com/gUUze6A.png"} alt={`${siteName} Logo`} className="h-8 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#pricing" className="text-sm text-white hover:text-white/80 transition">Pricing</a>
            <a href="https://discord.gg/freehosting" className="text-sm text-white hover:text-white/80 transition">Community</a>
            <a href={consoleUrl} className="text-sm text-white hover:text-white/80 transition">Dashboard</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <a onClick={() => window.location.href = consoleUrl} className="text-sm text-white hover:text-white/80 transition cursor-pointer">Login</a>
              <a
                onClick={() => window.location.href = consoleUrl}
                className="px-4 py-2 cursor-pointer rounded-full font-medium text-sm bg-white text-black hover:bg-white/90 transition"
              >
                Sign up free
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden flex items-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#15161a] border-t border-[#2e3337] mt-4 py-4">
            <nav className="flex flex-col gap-4 px-6">
              <a href="#pricing" className="text-sm text-white hover:text-white/80 py-2 transition">Pricing</a>
              <a href="https://discord.gg/freehosting" className="text-sm text-white hover:text-white/80 py-2 transition">Community</a>
              <a href={consoleUrl} className="text-sm text-white hover:text-white/80 py-2 transition">Dashboard</a>
              <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-[#2e3337]">
                <a onClick={() => window.location.href = consoleUrl} className="text-sm text-white hover:text-white/80 transition cursor-pointer">Login</a>
                <a
                  onClick={() => window.location.href = consoleUrl}
                  className="px-4 py-2 cursor-pointer rounded-full font-medium text-sm bg-white text-black hover:bg-white/90 transition text-center"
                >
                  Sign up free
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section with Background Image - With added top padding to account for navbar + status bar */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center pt-24">
        {/* Blurred background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(16, 17, 20, 0.7), rgba(12, 13, 15, 1.0)), url('https://i.imgur.com/EgpDZJE.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(1px)',
          }}
        />

        {/* Content container - not blurred */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
          <div className="hidden sm:mb-8 mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full bg-gradient-to-b from-[#0c0d0f]/20 to-[#0c0d0f]/40 backdrop-blur px-4 py-1.5 text-sm/6 text-white/70 ring-1 ring-white/5 hover:ring-white/10">
              Global, high-performance free servers.&nbsp; <a href="#" className="font-semibold text-white"><span className="absolute inset-0" aria-hidden="true"></span>Learn more <span aria-hidden="true">&rarr;</span></a>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold text-white/65 tracking-tight mb-8">
            The <span className="text-white">world's largest</span> free 24/7<br />game server hosting platform.
          </h1>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto text-white/70">
            Get started with a free 24/7 server in just 60 seconds.<br />
            {siteName} provides reliable, high-performance game servers for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={consoleUrl}
              className="px-8 py-4 rounded-lg text-base font-medium flex items-center justify-center bg-gradient-to-b from-white to-white/80 text-black hover:bg-white/90 transition active:scale-95"
            >
              Create your server
              <ChevronRight className="ml-2 h-5 w-5" />
            </a>
            <a
              href="#features"
              className="px-8 py-4 rounded-lg text-base font-medium border border-[#2e3337]/30 hover:bg-[#2e3337]/50 backdrop-blur transition active:scale-95"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-[#0c0d0f]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">Ok, but why {siteName}?</h2>
            <p className="max-w-2xl mx-auto text-[#95a1ad]">
              We provide a seamless experience for hosting your game servers with powerful features and an intuitive interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Server />}
              title="It's Free"
              description="Create unlimited free servers that stay online 24/7, with no hidden costs or purchases. Only purchase extra coins if you choose to!"
            />
            <FeatureCard
              icon={<Zap />}
              title="Blazing Fast Setup"
              description="Get your server up and running in less than 60 seconds thanks to our Cryogenic daemon instead of Pterodactyl Wings."
            />
            <FeatureCard
              icon={<Globe />}
              title="Global Network"
              description="Choose from multiple server locations around the world for the best possible performance. From Mexico City to Tokyo!"
            />
            <FeatureCard
              icon={<Shield />}
              title="DDoS Protection"
              description="Built-in protection against DDoS attacks to keep your server safe and available."
            />
            <FeatureCard
              icon={<Server />}
              title="Plugins"
              description="Install plugins and mods with just a few clicks using our built-in plugin manager."
            />
            <FeatureCard
              icon={<Shield />}
              title="Backups"
              description="Backups ensure your server data is always safe and recoverable."
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#0c0d0f]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-[#95a1ad]">
              Find answers to common questions about {siteName}.
            </p>
          </div>

          <div className="space-y-6">
            <FaqItem
              question="How do I create a server?"
              answer="Simply sign up for an account, click 'Create Server' on your dashboard, select your server type and configuration, and we'll have it up and running in seconds."
            />
            <FaqItem
              question="Are there really no hidden costs?"
              answer="Absolutely! Our free tier is completely free forever. You can upgrade to premium plans for more resources, but there's no obligation to do so."
            />
            <FaqItem
              question="Can I install custom plugins and mods?"
              answer={`Yes! ${siteName} supports a wide range of plugins and mods. You can install them through our intuitive plugin manager or upload them directly via the file manager.`}
            />
            <FaqItem
              question="How do I connect to my server?"
              answer="After creating your server, you'll receive an IP address and port. Use these details to connect from your game client. We also provide detailed connection instructions for each game type."
            />
            <FaqItem
              question="What happens if I need help?"
              answer="We offer support through our help center and community forums. Premium users get priority support with faster response times."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start your server?</h2>
          <p className="text-lg mb-8 text-[#95a1ad]">
            Join thousands of users who trust {siteName} for reliable, high-performance server hosting.
          </p>
          <a
            onClick={() => window.location.href = consoleUrl}
            className="px-8 py-4 rounded-lg text-base font-medium inline-block bg-white text-black hover:bg-white/90 transition"
          >
            Create Your Free Server
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#2e3337]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={settings?.logo || "https://i.imgur.com/gUUze6A.png"} alt={`${siteName} Logo`} className="h-8 w-auto" />
              </div>
              <p className="text-[#95a1ad] mb-4">
                Game hosting. For everyone.
              </p>
              <div className="flex gap-4">
                <a href="https://discord.gg/freehosting" className="text-[#95a1ad] hover:text-white">
                  Discord
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-[#95a1ad] hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-sm text-[#95a1ad] hover:text-white">Pricing</a></li>
                <li><a href={`https://status.${settings?.name.toLowerCase() || 'heliactyl'}.toledo`} className="text-sm text-[#95a1ad] hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#95a1ad] hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-sm text-[#95a1ad] hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-sm text-[#95a1ad] hover:text-white">Community</a></li>
                <li><a href="#" className="text-sm text-[#95a1ad] hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[#95a1ad] hover:text-white">About</a></li>
                <li><a href="#" className="text-sm text-[#95a1ad] hover:text-white">Blog</a></li>
                <li><a href="#" className="text-sm text-[#95a1ad] hover:text-white">Careers</a></li>
                <li><a href="#" className="text-sm text-[#95a1ad] hover:text-white">Legal</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#2e3337] flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-[#95a1ad] mb-4 md:mb-0">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#unavailable" className="text-sm text-[#95a1ad] hover:text-white">Terms</a>
              <a href="#unavailable" className="text-sm text-[#95a1ad] hover:text-white">Privacy</a>
              <a href="#unavailable" className="text-sm text-[#95a1ad] hover:text-white">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Desktop Navigation Dropdown
const NavDropdown = ({ title, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" onMouseLeave={() => setIsOpen(false)}>
      <button
        className="flex items-center gap-1 text-sm text-white hover:text-white/80 transition"
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-[#15161a] border border-[#2e3337] rounded-md shadow-lg py-2 z-50">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="block px-4 py-2 text-sm text-[#95a1ad] hover:bg-[#2e3337]/20 hover:text-white transition"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// Mobile Navigation Accordion
const MobileNavAccordion = ({ title, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className="flex items-center justify-between w-full text-sm text-white hover:text-white/80 py-2 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="pl-4 border-l border-[#2e3337] mt-2 space-y-2">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="block py-2 text-sm text-[#95a1ad] hover:text-white transition"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 rounded-lg border border-[#2e3337] transition-all hover:shadow-md">
    <div className="p-3 rounded-full inline-block mb-4 bg-[#202229] border-white/5">
      {React.cloneElement(icon, { className: 'h-4 w-4' })}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-[#95a1ad]">
      {description}
    </p>
  </div>
);

// Pricing Card Component
const PricingCard = ({ title, price, description, features, buttonText, popular }) => (
  <div className={`p-6 rounded-lg relative ${popular ? 'border-2 border-white' : 'border border-[#2e3337]'} bg-[#15161a]`}>
    {popular && (
      <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-3 px-3 py-1 text-xs font-medium rounded-full bg-white text-black">
        Most Popular
      </div>
    )}
    <div className="text-center mb-6">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="flex items-center justify-center">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-[#95a1ad] ml-1">&nbsp;one-time</span>
      </div>
      <p className="text-[#95a1ad] mt-2">
        {description}
      </p>
    </div>
    <ul className="space-y-3 mb-6">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center">
          <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
    <button onClick={() => window.location.href = consoleUrl} className={`w-full py-3 rounded-lg transition active:scale-95 text-sm font-medium ${popular ? 'bg-white text-black hover:bg-white/90' : 'border border-[#2e3337] hover:bg-[#2e3337]/50'}`}>
      {buttonText}
    </button>
  </div>
);

// FAQ Item Component
const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[#2e3337] rounded-lg overflow-hidden">
      <button
        className={`w-full text-left p-4 flex justify-between items-center focus:outline-none ${isOpen ? 'bg-[#15161a]' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{question}</span>
        <ChevronRight className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-[#101218] border-t border-[#2e3337]">
          <p className="text-[#95a1ad]">{answer}</p>
        </div>
      )}
    </div>
  );
};

export default LandingPage;