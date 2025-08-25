
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, Send, Star, MessageSquare 
} from 'lucide-react';
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import emailjs from 'emailjs-com';
import { useForm } from "react-hook-form";

// Define the form values type
interface FeedbackFormValues {
  name: string;
  email: string;
  rating: number;
  opinion: string;
  suggestions: string;
}

const Feedback = () => {
  const { currentUser, isLoading } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  
  // Initialize form with react-hook-form
  const form = useForm<FeedbackFormValues>({
    defaultValues: {
      name: currentUser?.displayName || '',
      email: currentUser?.email || '',
      rating: 5,
      opinion: '',
      suggestions: ''
    }
  });

  // EmailJS configuration
  const SERVICE_ID = 'service_ty10406'; // Your EmailJS service ID
  const TEMPLATE_ID = 'template_feedback'; // Template ID you created in EmailJS
  const USER_ID = 'rOb0aFIHqSNRXhqDz'; // Your EmailJS public key

  // Send feedback using EmailJS
  const sendFeedback = async (values: FeedbackFormValues) => {
    try {
      setIsSending(true);
      
      const templateParams = {
        from_name: values.name || 'Anonymous',
        user_email: values.email || 'Anonymous',
        rating: values.rating,
        opinion: values.opinion,
        suggestions: values.suggestions,
        to_email: 'ajit91884270@gmail.com',
      };
      
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, USER_ID);
      console.log('EmailJS response:', response);
      
      // Success message
      toast.success('आपकी प्रतिक्रिया भेज दी गई है / Your feedback has been sent');
      form.reset({
        name: currentUser?.displayName || '',
        email: currentUser?.email || '',
        rating: 5,
        opinion: '',
        suggestions: ''
      });
      
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast.error('प्रतिक्रिया भेजने में विफल / Failed to send feedback');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50 dark:from-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Share Your Feedback</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How is your experience with Study AI?</CardTitle>
            <CardDescription>
              Your feedback helps us improve our service for all students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(sendFeedback)}>
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  {...form.register("name")}
                />
              </div>
              
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...form.register("email")}
                />
              </div>
              
              {/* Star Rating */}
              <div className="space-y-2">
                <Label>Rate your experience</Label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onClick={() => form.setValue('rating', star)}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          form.watch('rating') >= star 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {form.watch('rating')} out of 5 stars
                </p>
              </div>
              
              {/* Opinion field */}
              <div className="space-y-2">
                <Label htmlFor="opinion">What did you like most?</Label>
                <Textarea
                  id="opinion"
                  placeholder="Tell us what you enjoyed about our service..."
                  className="min-h-[80px]"
                  {...form.register("opinion")}
                />
              </div>
              
              {/* Suggestions field */}
              <div className="space-y-2">
                <Label htmlFor="suggestions">Any suggestions for improvement?</Label>
                <Textarea
                  id="suggestions"
                  placeholder="Share your ideas for how we can improve..."
                  className="min-h-[120px]"
                  {...form.register("suggestions")}
                />
              </div>
              
              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={isSending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-orange-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">We Value Your Input</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Your feedback helps us create a better learning experience for all students.
            Thank you for taking the time to share your thoughts with us!
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All submissions are reviewed by our team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
