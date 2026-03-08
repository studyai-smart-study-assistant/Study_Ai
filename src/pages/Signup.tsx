
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Sparkles, Mail, Eye, EyeOff, User, Lock, ArrowRight, ShieldCheck, BookOpen, Brain, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const floatingIcons = [
  { Icon: BookOpen, x: '8%', y: '25%', delay: 0.3, size: 20 },
  { Icon: Brain, x: '88%', y: '18%', delay: 1.8, size: 22 },
  { Icon: Zap, x: '78%', y: '72%', delay: 1, size: 18 },
  { Icon: Star, x: '12%', y: '78%', delay: 2.2, size: 20 },
  { Icon: Sparkles, x: '55%', y: '8%', delay: 0.7, size: 16 },
];

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signup, currentUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    try {
      setIsLoading(true);
      await signup(email, password, { full_name: name });
      toast.success("Account created successfully!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Registration failed";
      if (error.message?.includes('already registered')) {
        errorMessage = "Email already in use";
      } else if (error.message?.includes('invalid')) {
        errorMessage = "Invalid email format";
      } else if (error.message?.includes('weak')) {
        errorMessage = "Password is too weak";
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ['', 'bg-destructive', 'bg-yellow-500', 'bg-green-500'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  const AnimatedInput = ({ id, icon: Icon, focusKey, ...props }: any) => (
    <motion.div
      className="relative group"
      animate={focusedField === focusKey ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <Input
        id={id}
        onFocus={() => setFocusedField(focusKey)}
        onBlur={() => setFocusedField(null)}
        className="h-12 pl-11 bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all duration-300 rounded-xl focus:shadow-[0_0_15px_hsl(267_75%_60%_/_0.15)]"
        {...props}
      />
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, 50, 0], rotate: [0, 30, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary-glow)) 0%, transparent 70%)' }}
          animate={{ scale: [1.3, 1, 1.3], x: [0, 40, 0], y: [0, -40, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -25, 0], opacity: [0.2, 0.7, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3, ease: "easeInOut" }}
          />
        ))}

        {/* Floating icons */}
        {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/15"
            style={{ left: x, top: y }}
            animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 5 + Math.random() * 3, repeat: Infinity, delay, ease: "easeInOut" }}
          >
            <Icon size={size} />
          </motion.div>
        ))}
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        className="w-full max-w-sm space-y-6 relative z-10"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo & Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.5, rotate: 10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
        >
          <motion.div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-5 relative overflow-hidden"
            whileHover={{ scale: 1.15, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              boxShadow: [
                '0 0 20px hsl(267 75% 60% / 0.3)',
                '0 0 40px hsl(267 75% 60% / 0.5)',
                '0 0 20px hsl(267 75% 60% / 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src="/images/study-ai-logo.png" alt="Study AI" className="w-full h-full object-cover rounded-3xl relative z-10" />
            <motion.div
              className="absolute inset-[-6px] rounded-[22px] border-2 border-primary/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-[-12px] rounded-[26px] border border-primary/15"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          <motion.h1
            className="text-3xl font-bold text-foreground tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Create Account
          </motion.h1>
          <motion.p
            className="text-sm text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Start your learning journey with Study AI 🚀
          </motion.p>
        </motion.div>

        {/* Signup Form Card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Card glow */}
          <motion.div
            className="absolute -inset-[1px] rounded-2xl opacity-50"
            animate={{
              background: [
                'linear-gradient(135deg, hsl(267 75% 60% / 0.3), transparent, hsl(270 80% 70% / 0.2))',
                'linear-gradient(225deg, hsl(267 75% 60% / 0.2), transparent, hsl(270 80% 70% / 0.3))',
                'linear-gradient(315deg, hsl(267 75% 60% / 0.3), transparent, hsl(270 80% 70% / 0.2))',
                'linear-gradient(135deg, hsl(267 75% 60% / 0.3), transparent, hsl(270 80% 70% / 0.2))',
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          <form
            onSubmit={handleSignup}
            className="relative space-y-4 bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-border/40 shadow-xl"
          >
            <motion.div className="space-y-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
              <AnimatedInput id="name" icon={User} focusKey="name" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Your full name" required />
            </motion.div>

            <motion.div className="space-y-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <AnimatedInput id="email" icon={Mail} focusKey="email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="your.email@example.com" required />
            </motion.div>

            <motion.div className="space-y-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              <motion.div
                className="relative group"
                animate={focusedField === 'password' ? { scale: 1.02 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Create a strong password"
                  className="h-12 pl-11 pr-11 bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all duration-300 rounded-xl focus:shadow-[0_0_15px_hsl(267_75%_60%_/_0.15)]"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showPassword ? 'hide' : 'show'}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>
              {password.length > 0 && (
                <motion.div className="space-y-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <motion.div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-border'}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: level * 0.1 }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strengthLabels[passwordStrength]} • Min 6 characters</p>
                </motion.div>
              )}
            </motion.div>

            <motion.div className="space-y-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirm Password</Label>
              <AnimatedInput id="confirmPassword" icon={ShieldCheck} focusKey="confirm" type="password" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required />
            </motion.div>

            {/* Terms */}
            <motion.div
              className="flex items-start space-x-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              whileHover={{ scale: 1.01 }}
            >
              <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)} className="mt-0.5" />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                I accept the{' '}
                <Link to="/privacy-policy" className="text-primary hover:text-primary/80 font-medium transition-colors">Privacy Policy</Link>
                {' '}and{' '}
                <Link to="/terms-of-service" className="text-primary hover:text-primary/80 font-medium transition-colors">Terms of Service</Link>
              </label>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-xl relative overflow-hidden group"
                style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-elegant)' }}
                disabled={isLoading || !acceptedTerms}
              >
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <motion.span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <ArrowRight className="h-4 w-4" />
                      </motion.span>
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Links */}
        <motion.div className="space-y-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors relative group">
              Log in
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm" onClick={() => navigate('/')}>
              Continue as Guest →
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;
