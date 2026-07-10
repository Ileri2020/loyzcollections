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
const Login = dynamic(() => import('@/components/myComponents/subs').then((e) => e.Login), { ssr: false })
import { Signup } from "@/components/myComponents/subs"

const Sidenav = () => {
    const pathname = usePathname();
    const { user, setUser } = useAppContext();
    return (
        <Sheet>
            <SheetTrigger className="flex justify-center items-center text-[32px] text-accent">
                <CiMenuFries />
            </SheetTrigger>
            <SheetContent side="left" className="flex h-full flex-col justify-between gap-6 px-6 py-8">
                <div className="flex flex-col items-start gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-xl shadow-md shadow-accent/70 bg-accent/10">
                            <Image
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

                <nav className="flex flex-col gap-4 text-base font-medium text-foreground">
                    {Links.Links.map((link, index) => (
                        <Link
                            href={link.path}
                            key={index}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                                link.path === pathname ? "bg-accent/10 text-accent" : "hover:bg-accent/5"
                            }`}
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="flex flex-col gap-3">
                    <Button
                        className="w-full"
                        variant="outline"
                        asChild
                    >
                        <Link href="/account">Login</Link>
                    </Button>
                    <Button
                        className="w-full"
                        variant="secondary"
                        asChild
                    >
                        <Link href="/signup">Signup</Link>
                    </Button>
                    {user?.id !== "nil" && (
                        <Button
                            className="w-full bg-red border-2 border-red-500 text-red-600"
                            variant="outline"
                            onClick={async () => {
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
                            }}
                        >
                            Logout
                        </Button>
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
