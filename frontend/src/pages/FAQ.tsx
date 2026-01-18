import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqData, type FAQItem } from '@/lib/data';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePageMeta } from '@/hooks/usePageMeta';

// Generate FAQ structured data for SEO
function generateFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'bridging', label: 'Bridging' },
  { id: 'wallets', label: 'Wallets' },
  { id: 'fees', label: 'Fees' },
  { id: 'security', label: 'Security' },
];

export default function FAQ() {
  usePageMeta({
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about bridging USDC to Stacks, fees, security, wallet support, and more.',
    canonicalPath: '/faq',
  });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  // Inject FAQ structured data on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-schema';
    script.textContent = JSON.stringify(generateFAQSchema(faqData));
    document.head.appendChild(script);
    
    return () => {
      const existingScript = document.getElementById('faq-schema');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const filtered = faqData.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">
              Everything you need to know about bridging with AnchorX
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 py-6 text-lg bg-surface-1"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  category === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Accordion */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No questions found matching your search.
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <AccordionItem
                    value={item.id}
                    className="glass rounded-xl px-6 border-none"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-5">
                      <span className="font-medium">{item.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          )}

          {/* Contact CTA */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Still have questions?
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Contact Support →
            </a>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
