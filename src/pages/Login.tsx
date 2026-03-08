
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Mail, Eye, EyeOff, Lock, ArrowRight, BookOpen, Brain, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const floatingIcons = [
  { Icon: BookOpen, x: '10%', y: '20%', delay: 0, size: 20 },
  { Icon: Brain, x: '85%', y: '15%', delay: 1.5, size: 24 },
  { Icon: Zap, x: '75%', y: '75%', delay: 0.8, size: 18 },
  { Icon: Star, x: '15%', y: '80%', delay: 2, size: 22 },
  { Icon: Sparkles, x: '50%', y: '10%', delay: 0.5, size: 16 },
  { Icon: BookOpen, x: '90%', y: '50%', delay: 1.2, size: 14 },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, currentUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    try {
      setIsLoading(true);
      await login(email, password);
      toast.success("Login successful!");
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Login failed";
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Invalid email or password";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "Please verify your email first";
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 60, 0],
            y: [0, -40, 0],
            rotate: [0, 45, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary-glow)) 0%, transparent 70%)' }}
          animate={{
            scale: [1.3, 1, 1.3],
            x: [0, -50, 0],
            y: [0, 40, 0],
            rotate: [0, -60, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(267 90% 75%) 0%, transparent 60%)' }}
          animate={{
            scale: [1, 1.2, 0.9, 1],
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating particle dots */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Floating study icons */}
        {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/15"
            style={{ left: x, top: y }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 5 + Math.random() * 3,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          >
            <Icon size={size} />
          </motion.div>
        ))}
      </div>

      {/* Grid lines overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        className="w-full max-w-sm space-y-8 relative z-10"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo & Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
        >
          <motion.div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 relative"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}
            whileHover={{ scale: 1.15, rotate: 10 }}
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
            <Sparkles className="w-9 h-9 text-primary-foreground relative z-10" />
            {/* Orbiting ring */}
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
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Welcome Back
          </motion.h1>
          <motion.p
            className="text-sm text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Sign in to continue your learning journey ✨
          </motion.p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Card glow effect */}
          <motion.div
            className="absolute -inset-[1px] rounded-2xl opacity-50"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent, hsl(var(--primary-glow) / 0.3))' }}
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
            onSubmit={handleLogin}
            className="relative space-y-5 bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-border/40 shadow-xl"
          >
            {/* Email field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <motion.div
                className="relative group"
                animate={focusedField === 'email' ? { scale: 1.02 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="your.email@example.com"
                  className="h-12 pl-11 bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all duration-300 rounded-xl focus:shadow-[0_0_15px_hsl(267_75%_60%_/_0.15)]"
                  required
                />
              </motion.div>
            </motion.div>

            {/* Password field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
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
                  placeholder="••••••••"
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
            </motion.div>

            {/* Submit button */}
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
                disabled={isLoading}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: 'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <motion.span
                        className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
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
        <motion.div
          className="space-y-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors relative group">
              Sign up
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground text-sm"
              onClick={() => navigate('/')}
            >
              Continue as Guest →
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
