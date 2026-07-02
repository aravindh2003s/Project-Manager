import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, MessageSquare, Phone, Mail, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL, getApiErrorMessage } from '../lib/api';

const faqs = [
  {
    question: 'How do I customize my apparel?',
    answer: 'Click on Customize, select product type, choose color and size, then add text, stickers, or images on canvas.'
  },
  {
    question: 'How does the sticker maker work?',
    answer: 'Upload any image in Sticker Maker. AI removes the background and returns a sticker-ready output.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept cards, UPI, net banking, and wallets through Razorpay.'
  },
  {
    question: 'What is your shipping policy?',
    answer: 'Standard delivery is 5-7 business days. Express delivery is 2-3 business days.'
  },
  {
    question: 'Can I return or exchange my order?',
    answer: 'Returns are accepted for manufacturing defects within 7 days of delivery.'
  },
  {
    question: 'How do I save my designs?',
    answer: 'Use the Save Design button in Customize page. Designs are saved to your account.'
  },
  {
    question: 'What file formats can I upload?',
    answer: 'JPG, PNG, and GIF are supported.'
  },
  {
    question: 'Do you offer bulk orders for events/teams?',
    answer: 'Yes. Contact support@vibestitch.com for bulk order pricing.'
  },
];

const localResponses = {
  order: 'You can track your order from My Orders in your profile.',
  return: 'Returns are accepted for manufacturing defects within 7 days.',
  payment: 'We support cards, UPI, net banking, and wallets.',
  delivery: 'Standard delivery is 5-7 business days. Express is 2-3 days.',
  design: 'Use Save Design in Customize page. Saved designs appear in Profile.',
  sticker: 'Use Sticker Maker to remove background and download sticker output.',
  contact: 'Reach support at support@vibestitch.com or +91-1234-567-890.',
};

function HelpPage() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I am your support assistant. Ask me anything.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  const filteredFaqs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getLocalResponse = (input) => {
    const inputLower = input.toLowerCase();
    for (const [key, response] of Object.entries(localResponses)) {
      if (inputLower.includes(key)) return response;
    }
    return 'Thanks for your message. Our support team will get back to you soon.';
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || sending) return;

    const userText = chatInput.trim();
    setMessages((prev) => [...prev, { type: 'user', text: userText }]);
    setChatInput('');
    setSending(true);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/help/chat`,
        { message: userText },
        { withCredentials: true }
      );
      const reply = response?.data?.reply || getLocalResponse(userText);
      setMessages((prev) => [...prev, { type: 'bot', text: reply }]);
    } catch (error) {
      const fallback = getLocalResponse(userText);
      setMessages((prev) => [...prev, { type: 'bot', text: fallback }]);
      console.error(getApiErrorMessage(error, 'Help bot unavailable'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />

      <div className="theme-shell pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Help Center & Support</h1>
            <p className="text-xl text-slate-600">Browse FAQs or chat with support bot</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-4 mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search for help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    data-testid="help-search-input"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className="glass rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                      data-testid={`faq-${index}`}
                    >
                      <span className="font-bold">{faq.question}</span>
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    {openIndex === index && (
                      <div className="border-t border-slate-100 px-6 py-4">
                        <p className="text-slate-600">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6 h-fit sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-lg">Customer Bot</h3>
              </div>

              <div className="space-y-4 mb-4 h-96 overflow-y-auto">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.type === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your question..."
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                <h4 className="font-bold mb-3">Contact Us</h4>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4" />
                  support@vibestitch.com
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-4 w-4" />
                  +91-1234-567-890
                </div>
                <div className="flex items-start gap-2 text-sm text-amber-600 mt-3">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Response time: 24 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPage;
