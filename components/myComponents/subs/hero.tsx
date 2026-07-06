"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, Clock, Truck, Star, ShieldCheck, CreditCard, ShoppingCart,
  Store, Banknote, Wallet, MapPin, User, Menu, ChevronLeft, ChevronRight,
  Instagram, Calendar, Phone, Search
} from 'lucide-react'
import { SearchInput } from './searchcomponent'
import { RiseAndFadeText } from './textctrl'
import { useAppContext } from '@/hooks/useAppContext'
import { motion, AnimatePresence } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from '@/components/ui/input'

type HeroVariant = 'modern-split' | 'immersive' | 'carousel' | 'story' | 'menu' | 'experience' | 'local';

interface HeroProps {
  variant?: HeroVariant;
}

// --- Shared Components ---

const BackgroundEffects = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute bottom-20 left-0 w-full opacity-[0.04]">
        <IconMarquee />
      </div>
      {/* Ribbons */}
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, 5, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[5%] w-[150px] h-[150px] md:w-[300px] md:h-[300px] bg-accent/10 md:bg-accent/20 rounded-full blur-[60px] md:blur-[80px]"
      />
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, 40, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[20%] right-[10%] w-[200px] h-[200px] md:w-[400px] md:h-[400px] bg-primary/10 md:bg-primary/20 rounded-full blur-[80px] md:blur-[100px]"
      />
      {/* Wave */}
      <div className="absolute top-1/2 left-0 w-[200%] h-32 opacity-[0.04] md:opacity-[0.06] text-accent flex overflow-hidden">
        <motion.div
          className="flex w-full"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <WaveSVG />
          <WaveSVG />
        </motion.div>
      </div>
    </div>
  )
}

const WaveSVG = () => (
  <svg className="w-1/2 h-full flex-shrink-0" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <path fill="currentColor" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
  </svg>
)

const IconMarquee = () => {
  const icons = [
    { Icon: ShoppingCart, key: 'cart' }, { Icon: CreditCard, key: 'card' },
    { Icon: Store, key: 'store' }, { Icon: Banknote, key: 'banknote' }, { Icon: Wallet, key: 'wallet' },
  ];
  const marqueeIcons = [...icons, ...icons, ...icons, ...icons, ...icons, ...icons];
  return (
    <motion.div
      className="flex items-center space-x-24 whitespace-nowrap"
      animate={{ x: [0, -1000] }}
      transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 40, ease: "linear" } }}
    >
      {marqueeIcons.map((item, index) => (
        <div key={index} className="flex items-center text-foreground">
          <item.Icon className="h-12 w-12 opacity-80" />
        </div>
      ))}
    </motion.div>
  );
};

// --- Main Component ---

const Hero = ({ variant = 'modern-split' }: HeroProps) => {
  const { user } = useAppContext();

  // Shared Logic
  const DynamicText = () => (
    <RiseAndFadeText
      texts={[
        "From Loyz Collections", "Card & Bank Transfer Payments", "Login With Google or Facebook",
        "Trendy Styles for Every You", "Quality You Can Trust", "Trusted by Homes and Businesses",
        "Fast & Reliable Delivery", "Carefully Packed for Freshness", "Customer Satisfaction Guaranteed",
        "Premium Products, Fair Prices", "Locally Sourced, Globally Delivered",
        "Modern Quality",
        "Taste You Can Trust", "Quality Without Compromise",
      ]}
      className="text-xl md:text-2xl mt-2 font-semibold text-muted-foreground overflow-hidden"
    />
  );

  const buttonBounce = {
    y: [0, -4, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  };

  const CTAButtons = ({ className = "" }: { className?: string }) => (
    <div className={`flex flex-col gap-3 sm:flex-row z-10 ${className}`}>
      <Link href="/store" className='w-full max-w-52'>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} animate={buttonBounce}>
          <Button className={`h-12 gap-1.5 px-8 transition-all duration-200 bg-accent hover:bg-accent/90 w-full text-white font-bold text-lg shadow-xl shadow-accent/20`} size="lg">
            Shop Now <ArrowRight className="h-5 w-5 animate-pulse" />
          </Button>
        </motion.div>
      </Link>
      {user?.id === "nil" && (
        <Link href="/account" className="w-full max-w-52">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} animate={buttonBounce} transition={{ delay: 0.2 }}>
            <Button className="h-12 px-8 w-full border-2 border-accent text-accent hover:bg-accent/10 transition-colors duration-200 font-semibold" size="lg" variant="outline">
              Login
            </Button>
          </motion.div>
        </Link>
      )}
    </div>
  );

  const TrustBadges = ({ className = "text-muted-foreground" }: { className?: string }) => (
    <div className={`flex flex-wrap gap-5 text-sm ${className} mt-4`}>
      <div className="flex items-center gap-1.5">
        <Truck className="h-5 w-5 text-primary" />
        <span>Fast shipping & delivery</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="h-5 w-5 text-primary" />
        <span>24/7 Customer Support</span>
      </div>
    </div>
  );

  // --- VARIANTS ---

  if (variant === 'modern-split') {
    return (
      <div className="relative overflow-hidden py-4 md:py-20 bg-background h-[90vh]">
        <BackgroundEffects />
        <div className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex flex-col justify-center space-y-3 md:space-y-8">
              <div className="flex z-50 md:hidden w-full justify-center items-center"><SearchInput /></div>
              
              <div className="md:space-y-4 space-y-1">
                <div className="absolute my-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20">
                  <Star className="mr-1 h-3 w-3 fill-accent" /> #1st Choice
                </div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative block lg:hidden h-[380px] -z-10 w-full justify-center overflow-y-clip /bg-red-600 rounded-t-xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[400px] h-[400px] bg-accent/10 rounded-full animate-blob mix-blend-multiply filter blur-xl opacity-70"></div>
                    <div className="relative w-[400px] h-[400px] bg-primary/10 rounded-full animate-blob animation-delay-2000 mix-blend-multiply filter blur-xl opacity-70 -ml-20"></div>
                    <img src="/mission-burrito-fast-food-shawarma-kati-roll-breakfast-6dd86711999109a88eae948201cd24bf.png" alt="Delicious Food" className="absolute z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
                  </div>
                </motion.div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mt-2">
                  <span className="block text-foreground">Affordable Quality Made For You</span>
                  <span className="block text-accent text-2xl md:text-3xl">STYLE . QUALITY . AFFORDABLE</span>
                </h1>
                <DynamicText />
                <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                  LOOK GOOD. FEEL CONFIDENT. LIVE LOYZ.
                </p>
              </div>
              <CTAButtons />
              <TrustBadges />
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative hidden lg:block h-[500px] w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[400px] h-[400px] bg-accent/10 rounded-full animate-blob mix-blend-multiply filter blur-xl opacity-70"></div>
                <div className="relative w-[400px] h-[400px] bg-primary/10 rounded-full animate-blob animation-delay-2000 mix-blend-multiply filter blur-xl opacity-70 -ml-20"></div>
                <img src="/mission-burrito-fast-food-shawarma-kati-roll-breakfast-6dd86711999109a88eae948201cd24bf.png" alt="Delicious Food" className="relative z-10 w-[450px] h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'immersive') {
    return (
      <div className="relative w-full h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img src="/small chops 1.jpg" alt="Background" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="backdrop-blur-md bg-black/30 p-8 md:p-10 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex z-50 md:hidden w-full justify-center items-center mb-6"><SearchInput /></div>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4 drop-shadow-md">
                Affordable Quality <br /><span className="text-accent">Made For You</span>
              </h1>
              <div className="text-gray-200 mb-8"><DynamicText /></div>
              <CTAButtons />
              <TrustBadges className="text-gray-300" />
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'carousel') {
    const slides = ['/small chops 1.jpg', '/small chops 3.jpg', '/small chops 4.jpg'];
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isFloating, setIsFloating] = useState(false);
    
    useEffect(() => {
        const t = setInterval(() => setCurrentSlide(c => (c + 1) % slides.length), 5000);
        return () => clearInterval(t);
    }, []);
    
    useEffect(() => {
        const handleScroll = () => setIsFloating(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
      <div className="relative h-screen w-full overflow-hidden">
        {/* Nav & Notification can be part of layout, but here simplified as part of hero */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-accent text-white py-1 text-center text-sm font-bold">Free delivery on orders over ₦5,000</div>
        
        <div className="absolute inset-0 bg-black/60 z-10" />
        <AnimatePresence mode='wait'>
            <motion.img key={currentSlide} src={slides[currentSlide]} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:1}} className="absolute inset-0 w-full h-full object-cover" />
        </AnimatePresence>

        <div className="relative z-20 container mx-auto h-full flex flex-col justify-center items-center text-center px-4 pt-20">
           <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">Order Fresh <span className="text-accent">Online</span></h1>
           <div className="text-gray-200 mb-8 text-xl"><DynamicText /></div>
           <CTAButtons />
           <div className="mt-8 flex gap-4 bg-white/10 backdrop-blur rounded-lg p-2 text-white">
                <MapPin /> <span className='font-bold'>Select Location:</span> Lagos (Main)
           </div>
           
           <div className="absolute bottom-0 w-full bg-background/90 backdrop-blur-md py-6 border-t hidden md:block">
              <div className="container mx-auto grid grid-cols-3 gap-4">
                  <div className='flex flex-col items-center'><Clock className="text-accent h-6 w-6"/><span className="font-bold">Mon-Sat: 8AM-8PM</span></div>
                  <div className='flex flex-col items-center'><Truck className="text-accent h-6 w-6"/><span className="font-bold">Fast Delivery</span></div>
                  <div className='flex flex-col items-center'><Star className="text-accent h-6 w-6"/><span className="font-bold">5-Star Quality</span></div>
              </div>
           </div>
        </div>
        
        {isFloating && (
           <motion.div initial={{y:100}} animate={{y:0}} className="fixed bottom-6 right-6 z-50">
              <Button size="lg" className="rounded-full h-16 w-16 shadow-2xl bg-accent text-white"><ShoppingCart /></Button>
           </motion.div>
        )}
      </div>
    )
  }

  if (variant === 'story') {
    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            <div className="fixed inset-0 -z-10 bg-[url('/small%20chops%201.jpg')] bg-cover bg-center bg-fixed opacity-20" />
            <div className="container mx-auto px-4 py-20 min-h-screen grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <h1 className="text-6xl font-bold">Crafted with <span className="text-accent">Passion</span></h1>
                    <div className="text-muted-foreground text-xl"><DynamicText /></div>
                    <Accordion type="single" collapsible className="w-full bg-background/80 backdrop-blur-sm rounded-lg p-4">
                        <AccordionItem value="story">
                            <AccordionTrigger className='text-lg font-bold'>Our Story</AccordionTrigger>
                            <AccordionContent>Founded in 2010... bringing authentic flavors to your table.</AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="team">
                            <AccordionTrigger className='text-lg font-bold'>Meet the Team</AccordionTrigger>
                            <AccordionContent>Expert chefs and nutritionists dedicated to quality.</AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <CTAButtons />
                </div>
                <div className="bg-muted p-8 rounded-2xl space-y-6">
                    <h3 className="text-2xl font-bold">Why Choose Us?</h3>
                    <TrustBadges className="" />
                    <div className="flex gap-2 mt-4">
                        <Instagram className="text-accent" /> Follow our journey
                    </div>
                </div>
            </div>
            <div className="fixed bottom-6 right-6 z-40">
                <Button className="bg-accent text-white shadow-xl rounded-full px-6 py-4 font-bold">Join us for dinner</Button>
            </div>
        </div>
    )
  }

  if (variant === 'menu') {
      return (
          <div className="min-h-screen bg-secondary/10 flex flex-col items-center py-20 px-4">
               <div className="text-center mb-12">
                   <h1 className="text-5xl font-bold mb-4">Our <span className="text-accent">Menu</span> Highlights</h1>
                   <DynamicText />
               </div>
               
               <div className="flex gap-4 mb-8 overflow-x-auto w-full justify-center">
                   {['Starters', 'Mains', 'Desserts', 'Drinks'].map(c => (
                       <Button key={c} variant="outline" className="rounded-full px-6">{c}</Button>
                   ))}
               </div>
               
               <div className="grid md:grid-cols-3 gap-6 max-w-6xl w-full">
                   {[1,2,3].map(i => (
                       <div key={i} className="bg-card rounded-xl overflow-hidden shadow-lg group">
                           <div className="h-48 bg-muted relative overflow-hidden">
                               <img src={`/small chops ${i}.jpg`} className="object-cover w-full h-full group-hover:scale-110 transition duration-500" />
                           </div>
                           <div className="p-6">
                               <h3 className="text-xl font-bold">Special Delicacy {i}</h3>
                               <p className="text-muted-foreground text-sm mb-4">Delicious and spicy...</p>
                               <div className="flex justify-between items-center">
                                   <span className="text-accent font-bold text-lg">₦2,500</span>
                                   <Button size="sm">Add to Cart</Button>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
               
               <div className="mt-12 w-full max-w-4xl bg-background rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between">
                   <div>
                       <h3 className="text-2xl font-bold">Chef's Picks</h3>
                       <p className="text-muted-foreground">Hand-picked favorites for you.</p>
                   </div>
                   <div className="mt-4 md:mt-0"><CTAButtons /></div>
               </div>
          </div>
      )
  }

  if (variant === 'experience') {
      return (
          <div className="min-h-screen container mx-auto py-20 px-4 grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                  <h1 className="text-5xl font-bold">Experience the <span className="text-accent">Ambiance</span></h1>
                  <DynamicText />
                  <div className="grid grid-cols-2 gap-4">
                       <img src="/small chops 1.jpg" className="rounded-lg shadow hover:scale-105 transition cursor-pointer" />
                       <img src="/small chops 3.jpg" className="rounded-lg shadow hover:scale-105 transition cursor-pointer" />
                       <img src="/shawama pics 1.jpg" className="rounded-lg shadow hover:scale-105 transition cursor-pointer col-span-2 h-40 object-cover" />
                  </div>
              </div>
              <div className="flex flex-col justify-center space-y-8">
                  <div className="bg-accent/10 p-6 rounded-lg text-center">
                      <h3 className="text-xl font-bold">Special Offer Ends In:</h3>
                      <div className="text-4xl font-mono font-bold text-accent mt-2">12:34:56</div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="event"><AccordionTrigger>Events</AccordionTrigger><AccordionContent>Book your events...</AccordionContent></AccordionItem>
                        <AccordionItem value="private"><AccordionTrigger>Private Dining</AccordionTrigger><AccordionContent>Exclusive dining...</AccordionContent></AccordionItem>
                  </Accordion>
                  <CTAButtons />
                  <TrustBadges />
              </div>
          </div>
      )
  }

  if (variant === 'local') {
      return (
          <div className="min-h-screen flex flex-col lg:flex-row">
              <div className="lg:w-1/2 bg-muted relative min-h-[400px]">
                 <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                     <span className="text-muted-foreground font-bold">[Map Embed Placeholder]</span>
                 </div>
                 <div className="absolute bottom-4 left-4 bg-card p-4 rounded shadow-lg max-w-xs">
                     <h4 className="font-bold">Visit Us</h4>
                     <p className="text-sm">123 Food Street, Lagos</p>
                 </div>
              </div>
              <div className="lg:w-1/2 p-12 flex flex-col justify-center space-y-8">
                  <h1 className="text-5xl font-bold">Local & <span className="text-accent">Fresh</span></h1>
                  <DynamicText />
                  <p className="text-lg text-muted-foreground">We partner with local farmers...</p>
                  <div className="grid grid-cols-3 gap-2">
                       <img src="/small chops 1.jpg" className="rounded aspect-square object-cover" />
                       <img src="/small chops 3.jpg" className="rounded aspect-square object-cover" />
                       <img src="/shawama pics 1.jpg" className="rounded aspect-square object-cover" />
                  </div>
                  <CTAButtons />
                  <div className="flex gap-2">
                      <Input placeholder="Enter email for newsletter" />
                      <Button>Subscribe</Button>
                  </div>
              </div>
          </div>
      )
  }

  return null;
}

export default Hero
