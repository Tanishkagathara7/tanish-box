import { useState } from "react";
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  Book,
  CreditCard,
  MapPin,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6 text-cricket-green" />,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      contact: "+91 1800-BOXCRIC",
      availability: "Mon-Sun, 6 AM - 11 PM",
      action: "Call Now",
    },
    {
      icon: <Mail className="w-6 h-6 text-cricket-yellow" />,
      title: "Email Support",
      description: "Send us your questions anytime",
      contact: "support@boxcric.com",
      availability: "Response within 24 hours",
      action: "Send Email",
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-sky-blue" />,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available in app",
      availability: "Mon-Sun, 9 AM - 9 PM",
      action: "Start Chat",
    },
  ];

  const categories = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "Booking & Reservations",
      description: "How to book grounds, modify bookings, and cancellations",
      color: "bg-cricket-green/10 text-cricket-green",
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Payments & Refunds",
      description: "Payment methods, refund policies, and billing issues",
      color: "bg-cricket-yellow/10 text-cricket-yellow",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Ground Information",
      description: "Ground details, amenities, and location guidance",
      color: "bg-sky-blue/10 text-sky-blue",
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Account & Settings",
      description: "Profile management, notifications, and app settings",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  const faqs = [
    {
      id: "booking",
      category: "Booking & Reservations",
      question: "How do I book a cricket ground?",
      answer:
        "To book a cricket ground: 1) Select your city or allow location access 2) Browse available grounds or use filters 3) Choose your preferred ground and time slot 4) Enter player details and make payment 5) Receive instant confirmation with ground owner contact details.",
    },
    {
      id: "cancellation",
      category: "Booking & Reservations",
      question: "What is the cancellation policy?",
      answer:
        "You can cancel your booking up to 4 hours before the scheduled time for a full refund. Cancellations between 2-4 hours will receive a 50% refund. No refund is available for cancellations within 2 hours of the booking time.",
    },
    {
      id: "payment",
      category: "Payments & Refunds",
      question: "What payment methods are accepted?",
      answer:
        "We accept all major credit/debit cards, UPI payments (PhonePe, Google Pay, Paytm), net banking, and digital wallets. All transactions are secured with 256-bit encryption.",
    },
    {
      id: "refund",
      category: "Payments & Refunds",
      question: "How long does it take to receive a refund?",
      answer:
        "Refunds are processed within 24 hours of cancellation. The amount will be credited back to your original payment method within 5-7 business days depending on your bank.",
    },
    {
      id: "location",
      category: "Ground Information",
      question: "How accurate are the ground locations?",
      answer:
        "All ground locations are verified by our team. We provide exact GPS coordinates, detailed address, and landmark information. You can also contact the ground owner directly for specific directions.",
    },
    {
      id: "amenities",
      category: "Ground Information",
      question: "Are the listed amenities guaranteed?",
      answer:
        "Yes, all amenities listed are verified during our ground inspection process. If any listed amenity is unavailable during your visit, you can report it and may be eligible for a partial refund.",
    },
    {
      id: "profile",
      category: "Account & Settings",
      question: "How do I update my profile information?",
      answer:
        "Go to 'My Profile' from the navbar, then click 'Edit Profile'. You can update your name, email, phone number, and location preferences. Don't forget to save your changes.",
    },
    {
      id: "notifications",
      category: "Account & Settings",
      question: "How do I manage notification preferences?",
      answer:
        "Visit Settings > Notification Preferences to customize email, SMS, and push notifications. You can choose to receive booking confirmations, ground recommendations, and promotional offers.",
    },
  ];

  const filteredFAQs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : faqs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-grass-light via-white to-sky-blue/10">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help & Support
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to your questions or get in touch with our support
            team. We're here to help you have the best cricket experience.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help articles, FAQs, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-cricket-green"
            />
          </div>
        </div>

        {/* Contact Methods */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Get in Touch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className="border-2 border-gray-200 hover:border-cricket-green/50 transition-colors duration-200"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-cricket rounded-full flex items-center justify-center mx-auto mb-4">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{method.description}</p>
                  <div className="text-sm text-gray-700 mb-1 font-medium">
                    {method.contact}
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    {method.availability}
                  </div>
                  <Button
                    size="sm"
                    className="bg-cricket-green hover:bg-cricket-green/90"
                  >
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Help Categories */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="border-2 border-gray-200 hover:border-cricket-green/50 transition-colors duration-200 cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {category.title}
                      </h3>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredFAQs.map((faq) => (
              <Card key={faq.id} className="border border-gray-200">
                <Collapsible
                  open={openFAQ === faq.id}
                  onOpenChange={() =>
                    setOpenFAQ(openFAQ === faq.id ? null : faq.id)
                  }
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="text-xs">
                            {faq.category}
                          </Badge>
                          <CardTitle className="text-left text-lg">
                            {faq.question}
                          </CardTitle>
                        </div>
                        {openFAQ === faq.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}

            {filteredFAQs.length === 0 && searchQuery && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any help articles matching "{searchQuery}".
                    Try different keywords or contact our support team.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="text-cricket-green border-cricket-green hover:bg-cricket-green/10"
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Still Need Help */}
        <section className="mt-16 text-center">
          <Card className="border-2 border-cricket-green/20 bg-cricket-green/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Still Need Help?
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Can't find what you're looking for? Our friendly support team is
                always ready to assist you with any questions or issues.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-cricket-green hover:bg-cricket-green/90">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Live Chat
                </Button>
                <Button
                  variant="outline"
                  className="text-cricket-green border-cricket-green hover:bg-cricket-green/10"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Help;
