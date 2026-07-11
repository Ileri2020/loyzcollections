"use client"
import Image from "next/image"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { CiMenuFries } from "react-icons/ci"
import Links from "../../data/links"
import { ModeToggle } from '@/components/ui/mode-toggle'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAppContext } from "@/hooks/useAppContext"
import { signOut } from "next-auth/react"
import dynamic from 'next/dynamic'
import { useEffect, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const Login = dynamic(() => import('@/components/myComponents/subs').then((e) => e.Login), { ssr: false })

type SidebarCategory = {
    id?: string | number;
    name: string;
    image?: string | null;
    path: string;
};

const CATEGORY_STORAGE_KEY = "loyz-sidebar-categories";

const Sidenav = () => {
    const pathname = usePathname();
    const { user, setUser } = useAppContext();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [categories, setCategories] = useState<SidebarCategory[]>([]);
    const isAuthenticated = user?.id !== "nil";

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
        setUser({
            name: "visitor",
            id: "nil",
            email: "nil",
            image: "",
            role: "user",
            contact: "xxxx",
            addresses: [],
            shippingAddress: null,
        });
        setIsLogoutDialogOpen(false);
    };

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await fetch("/api/dbhandler?model=category");
                if (!response.ok) throw new Error("Unable to fetch categories");

                const dbCategories = await response.json();
                const normalizedDbCategories = (dbCategories || []).map((category: any) => ({
                    id: category.id,
                    name: category.name,
                    image: category.image || "/logo.png",
                    path: `/store?category=${encodeURIComponent(String(category.name).toLowerCase())}`,
                }));

                let cachedCategories: SidebarCategory[] = [];
                if (typeof window !== "undefined") {
                    const storedCategories = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
                    if (storedCategories) {
                        try {
                            cachedCategories = JSON.parse(storedCategories);
                        } catch {
                            cachedCategories = [];
                        }
                    }
                }

                const isSameAsCache =
                    normalizedDbCategories.length === cachedCategories.length &&
                    normalizedDbCategories.every((category, index) => {
                        const cachedCategory = cachedCategories[index];
                        return cachedCategory?.name === category.name && cachedCategory?.image === category.image;
                    });

                if (typeof window !== "undefined") {
                    if (pathname === "/" && !isSameAsCache) {
                        window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(normalizedDbCategories));
                    } else if (normalizedDbCategories.length > 0) {
                        window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(normalizedDbCategories));
                    }
                }

                setCategories(normalizedDbCategories.length > 0 ? normalizedDbCategories : cachedCategories);
            } catch {
                if (typeof window !== "undefined") {
                    const storedCategories = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
                    if (storedCategories) {
                        try {
                            setCategories(JSON.parse(storedCategories));
                        } catch {
                            setCategories([]);
                        }
                    }
                }
            }
        };

        loadCategories();
    }, [pathname]);

    return (
        <Sheet>
            <SheetTrigger className="flex justify-center items-center text-[32px] text-accent">
                <CiMenuFries />
            </SheetTrigger>
            <SheetContent side="left" className="flex h-full flex-col justify-between gap-6 px-6 py-8">
                <div className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl shadow-md shadow-accent/70 bg-accent/10">
                            <img
                                src="/logo.png"
                                alt="Loyz Collections"
                                width={48}
                                height={48}
                                className="object-contain"
                            />
                        </div>
                        <div>
                            {/* <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Brand</p> */}
                            <h2 className="text-lg font-semibold">Loyz Collections</h2>
                        </div>
                    </div>
                    <p className="max-w-xs text-sm text-muted-foreground">Look good. Feel confident. Live LOYZ.</p>
                </div>

                <nav className="flex flex-1 flex-col gap-4 overflow-y-auto text-base font-medium text-foreground">
                    <div className="flex flex-col gap-2">
                        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Pages</p>
                        {Links.Links.map((link, index) => (
                            <Link
                                href={link.path}
                                key={index}
                                className={`flex items-center justify-start gap-3 rounded-lg bg-accent/5 px-3 py-2 font-bold shadow-md shadow-accent/70 transition-colors ${
                                    link.path === pathname ? "bg-accent/10 text-accent dark:bg-accent/30" : "hover:bg-accent/5"
                                }`}
                            >
                                {link.icon}
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Categories</p>
                        {categories.map((category, index) => (
                            <Link
                                href={category.path}
                                key={category.id ?? `${category.name}-${index}`}
                                className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2 transition-colors hover:bg-accent/5"
                            >
                                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-accent/10">
                                    <img
                                        src={category.image || "/logo.png"}
                                        alt={category.name}
                                        width={36}
                                        height={36}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <span className="font-semibold">{category.name}</span>
                            </Link>
                        ))}
                    </div>
                </nav>

                <div className="flex flex-col gap-3">
                    {!isAuthenticated ? (
                        <Login />
                    ) : (
                        <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    className="w-full border-2 border-red-500 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
                                    variant="outline"
                                >
                                    Logout
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Log out?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You will be signed out of your account.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <div className="pt-2">
                        <ModeToggle />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

export default Sidenav
