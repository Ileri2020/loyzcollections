"use client"

import Link from 'next/link';
import Nav from './nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Sidenav from './sidenav';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Suspense, useEffect } from "react"
import { AiOutlineSearch } from "react-icons/ai"
import { Advert } from "@/components/myComponents/subs"
import loyzspiceslogo from "@/public/logo.png"
import Image from "next/image";
import { Cart } from '../myComponents/subs/cart';
import { SearchInput } from '../myComponents/subs/searchcomponent';
import { useSession } from "next-auth/react";
import { useAppContext } from '@/hooks/useAppContext';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import { GlobalDialog } from '../ui/GlobalDialog';

const Navbar = (): JSX.Element => {
  const { setUser, user } = useAppContext();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && user.email === "nil") {
      setUser({
        ...session.user,
      });
    }
  }, [status, session, user.email, setUser]);

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-30 w-[100vw] overflow-clip flex flex-col m-0 p-0">
        <header className="w-[100%] justify-center items-center py-1 bg-background sticky top-0 z-10 shadow-md shadow-accent/40">
          <div className="container mx-auto flex justify-between items-center gap-2 h-[60px] /md:h-[50px] overflow-clip">

            {/* Sidenav Mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="lg:hidden">
                  <Sidenav />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Menu</p>
              </TooltipContent>
            </Tooltip>

            {/* Logo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={"/"} className="flex dark:hidden flex-1 md:flex-none h-full max-h-[200px] md:max-h-[50px] /bg-red-500 overflow-clip justify-center items-center">
                  <Image src={loyzspiceslogo} alt="Home" className="h-[50%] w-[35%] md:h-[130%] md:w-[130%]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go Home</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={"/"} className="hidden dark:flex flex-1 md:flex-none max-h-[43px] md:max-h-[50px] overflow-clip justify-center items-center py-5">
                  <Image src={loyzspiceslogo} alt="Home" className="w-[100px] h-auto" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go Home</p>
              </TooltipContent>
            </Tooltip>

            {/* Mobile Search Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="lg:hidden relative flex justify-center items-center text-accent text-xl gap-1"
                >
                  {/* <Button 
                    variant='outline'
                    className="justify-center items-center rounded-full w-[35px] h-[35px] overflow-clip text-accent text-xl"
                  >
                    <AiOutlineSearch />
                  </Button> */}

                  <Cart />

                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cart</p>
              </TooltipContent>
            </Tooltip>

            <div className="md:flex hidden">
              {/* Search Input */}
              <SearchInput />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">

              <Nav />

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Cart />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Cart</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ModeToggle />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Theme</p>
                </TooltipContent>
              </Tooltip>

            </div>
          </div>
        </header>
        <Advert />
        <GlobalDialog />
      </div>
    </TooltipProvider>
  )
}

export default Navbar;
