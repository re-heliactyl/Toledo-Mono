import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, BookOpenIcon, QuestionMarkCircleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../hooks/useSettings';

function FAQCard({ icon: Icon, title, description }) {
  return (
    <div className="border border-[#2e3337]/50 rounded-lg p-5 bg-transparent transition duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#202229]">
          <Icon className="w-4 h-4 text-[#95a1ad]" />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-[#95a1ad] text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function FAQSection() {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(320);
  const { settings } = useSettings();
  const siteName = settings?.name || "Heliactyl";

  // Calculate proper height for animation
  useEffect(() => {
    if (containerRef.current) {
      const fullHeight = containerRef.current.scrollHeight;
      setContainerHeight(expanded ? fullHeight : 320);
    }
  }, [expanded]);

  // FAQs data
  const faqs = [
    {
      icon: BookOpenIcon,
      title: "Get started",
      description: `Welcome to ${siteName}! Start by creating your first server. We give every user a balance of resources (Memory, CPU, Disk and Servers) - you can split them across multiple servers or use them all on one. It's up to you. You can earn coins for free and use them to purchase more resources - then you can create more servers or upgrade existing ones.`
    },
    {
      icon: QuestionMarkCircleIcon,
      title: "Get support",
      description: "Need help? Our support team is available 24/7. Submit a ticket, chat with our team, or browse our knowledge base for quick answers to common questions."
    },
    {
      icon: GlobeAltIcon,
      title: "Join our community",
      description: `Connect with other ${siteName} users in our Discord server. Get quick help via public support or chat with our community.`
    },
    // Additional FAQs that will be hidden initially
    {
      icon: BookOpenIcon,
      title: "Server optimization tips",
      description: "Learn advanced techniques to optimize your server performance. From resource allocation to networking configurations, discover how to get the most out of your infrastructure."
    },
    {
      icon: QuestionMarkCircleIcon,
      title: "Billing and subscriptions",
      description: "Understand our pricing structure, billing cycles, and subscription options. Find out how to upgrade your plan, manage payment methods, and view your billing history."
    },
    {
      icon: GlobeAltIcon,
      title: "Security best practices",
      description: "Keep your servers and data safe with our security recommendations. Learn about access controls, firewall configurations, encryption, and more to protect your infrastructure."
    }
  ];

  return (
    <div className="space-y-6 mt-12">
      <h2 className="text-lg font-medium">FAQ</h2>

      <div
        ref={containerRef}
        className="relative overflow-hidden transition-all duration-700 ease-in-out"
        style={{ height: containerHeight }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {faqs.map((faq, index) => (
            <FAQCard
              key={index}
              icon={faq.icon}
              title={faq.title}
              description={faq.description}
            />
          ))}
        </div>

        {/* Gradient overlay */}
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#101217] to-transparent pointer-events-none" />
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-6 py-2.5 bg-[#202229] hover:bg-[#2e3337] border border-white/5 rounded-full font-medium text-sm transition-all duration-300 flex items-center gap-2 group"
        >
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}