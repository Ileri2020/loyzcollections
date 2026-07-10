"use client"
import { motion } from "framer-motion"
import {Signup} from "@/components/myComponents/subs"
import EditUser from "@/components/myComponents/subs/useredit"
import dynamic from 'next/dynamic'
const Login = dynamic(() => import('@/components/myComponents/subs').then((e) => e.Login),{ssr: false,})
import { Button } from "@/components/ui/button"
import { BiPencil } from "react-icons/bi"
import { useEffect } from "react"
import Link from "next/link"
import { useAppContext } from "@/hooks/useAppContext"
import { CiCamera } from "react-icons/ci"
import {ProfileImg} from "@/components/myComponents/subs/fileupload"
import { signOut } from "next-auth/react";
import UserShippingAddressForm from "@/prisma/forms/userShippingAddressForm"

const Account = () => {
  const {user, setUser } = useAppContext();
  if (user.name === "visitor" && user.email === "nil"){
    return(
      <div className="w-full h-[50vh] flex flex-col justify-center items-center">
        <div className="font-semibold text-lg text-destructive">You are not logged in</div>
        <div className="flex flex-row gap-5">
          <Login />
          <Signup />
        </div>
      </div>
    )
  }

  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] min-h-full overflow-clip"
    >
      <div className="w-full h-full flex flex-col items-center">
        <div className="relative my-10 mx-2 flex justify-center items-center">
          <div className="w-44 h-44  rounded-full flex-1 overflow-clip justify-center items-center">
            <img src={(user.image==null || user.image == undefined || user.image =='') ? "https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png" : user.image } className="w-full" alt="" />
          </div>
          <ProfileImg /> 
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xl">
          {/* <div className="w-full px-3">
            <div className="flex flex-row gap-3 items-center">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1 flex flex-col">
                <div className="text-sm text-foreground/70">Name</div>
                <div className="text-lg font-semibold">Tobi Bola</div>
              </div>
              <div className="text-3xl text-accent"><BiPencil /></div>
            </div>
          </div> */}
          <div className="w-full px-3">
            <div className="flex flex-row gap-3">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1">
                <div className="text-sm text-foreground/70">name</div>
                <div className="text-lg font-semibold">{user.name}</div>
              </div>
            </div>
          </div>
          {/* <div className="w-full px-3">
            <div className="flex flex-row gap-3">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1">
                <div className="text-sm text-foreground/70">Department</div>
                <div className="text-lg font-semibold">{user.department}</div>
              </div>
            </div>
          </div> */}
          <div className="w-full px-3">
            <div className="flex flex-row gap-3">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1">
                <div className="text-sm text-foreground/70">Email</div>
                <div className="text-lg font-semibold">{user.email}</div>
              </div>
            </div>
          </div>
          <div className="w-full px-3">
            <div className="flex flex-row gap-3">
              <div className="w-14 h-14">icon</div>
              <div className="flex-1">
                <div className="text-sm text-foreground/70">Contact</div>
                <div className="text-lg font-semibold">{user.contact}</div>
              </div>
            </div>
          </div>
          {user.addresses && user.addresses.length > 0 && user.addresses.map((addr, index) => (
            <div key={addr.id || index} className="w-full px-3">
              <div className="flex flex-row gap-3">
                <div className="w-14 h-14">icon</div>
                <div className="flex-1">
                  <div className="text-sm text-foreground/70">Address</div>
                  <div className="text-lg font-semibold">
                    {`${addr.address || ''} ${addr.city || ''}, ${addr.state || ''}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
          

        </div>
        <div className="flex flex-row max-w-sm gap-2" >
          <Button
            className="bg-red border-2 border-red-500 text-red-600 w-full flex-1"
            variant="outline"
            onClick={async () => {
              await signOut({ callbackUrl: "/" });
              setUser({
                name: "visitor",
                id: "nil",
                email: "nil",
                image: "https://res.cloudinary.com/dc5khnuiu/image/upload/v1752627019/uxokaq0djttd7gsslwj9.png",
                role: "user",
                contact: "xxxx",
                addresses: [],
                shippingAddress: null,
              });
            }}
          >
            Logout
          </Button>
          <EditUser />
        </div>
      </div>
    </motion.section> 
  )}

export default Account




