import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Phone, MessageSquare, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const contactMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/support", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "We've received your message and will respond shortly.",
      });
      setSubject("");
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "There was an error sending your message",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject for your message",
        variant: "destructive",
      });
      return;
    }
    
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter your message",
        variant: "destructive",
      });
      return;
    }
    
    contactMutation.mutate({ subject, message });
  };
  
  const faqItems = [
    {
      question: "How do I earn commissions on ReferEarn?",
      answer: "There are two ways to earn commissions on our platform: 1) Refer new users who upgrade their accounts, and 2) Earn product commissions by becoming an Affiliator. When your referrals upgrade, you'll receive 20% of their activation fee. Your upline also benefits with 10% for the second level and 5% for the third level."
    },
    {
      question: "What's the difference between an Active User and an Affiliator?",
      answer: "Active Users can earn commissions from referrals. When someone you refer upgrades their account, you receive a commission. Affiliators have all the benefits of Active Users plus the ability to earn commissions on product sales. The upgrade costs are $100 for Active User and $250 for Affiliator."
    },
    {
      question: "How do I withdraw my commissions?",
      answer: "Go to the Withdrawals page, enter the amount you wish to withdraw and your preferred payment method. We support withdrawals through Bkash, bank transfers, and PayPal. The minimum withdrawal amount is $20, and processing typically takes 1-3 business days."
    },
    {
      question: "How do I share my referral code?",
      answer: "Your unique referral code is displayed on your dashboard and in the sidebar. You can copy it directly or use the 'Share Referral Link' button to generate a shareable link. When someone registers using your referral code, they'll automatically be connected to your network."
    },
    {
      question: "What are the commission rates for products?",
      answer: "Commission rates vary by product. Each product displays its commission rate on the product card, typically ranging from 5% to 25%. These commissions are paid out when a purchase is made using your referral code."
    },
    {
      question: "How can I track my referrals and earnings?",
      answer: "Visit the Referrals page to see a list of all users you've referred and their status. The Earnings page provides a detailed breakdown of all your commissions, including filters to analyze your earnings by time period and type."
    },
  ];
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-gray-800 mb-1">Support Center</h1>
          <p className="text-gray-600">Get help and answers to your questions</p>
        </div>
        
        <Tabs defaultValue="contact" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contact" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send us a message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="What's your question about?"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Describe your issue or question in detail..."
                          className="min-h-[150px]"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto"
                        disabled={contactMutation.isPending}
                      >
                        {contactMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <Mail className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700">Email Us</h3>
                        <a href="mailto:support@referearn.com" className="text-primary-600 hover:underline">
                          support@referearn.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <Phone className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700">Call Us</h3>
                        <p className="text-gray-600">+1 (800) 123-4567</p>
                        <p className="text-sm text-gray-500">Mon-Fri, 9am-5pm</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                        <HelpCircle className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700">Support Hours</h3>
                        <p className="text-gray-600">24/7 Online Support</p>
                        <p className="text-sm text-gray-500">We aim to respond within 24 hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="faq" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <HelpCircle className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Need more help?</h3>
                      <p className="text-sm text-gray-600">
                        If you can't find an answer to your question, please contact our support team.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}