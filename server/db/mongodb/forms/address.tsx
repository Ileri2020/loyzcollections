"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import React, { FormEvent, useEffect, useRef, useState } from 'react'
import {serveraddr} from "@/data/env"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import {
  ColumnDef,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const AddressForm = (props: {method : string,}) => {
  const [details, setDetails] = useState({
    address : "",
    city : 0,
    state : 0,
    zip : 0,
    country : "",
  })

  const [render, setRender] = useState(0);

  useEffect(() => {
  }, [render]);

  interface RefObject<T> {
    readonly current: T | null
  }

    const form = useRef<HTMLFormElement>(null);

    const addProduct =async (e : FormEvent) => {
      e.preventDefault();
      const address = {}

      const submitToServer =async ()=>{
        await fetch(`${serveraddr + "/api/v1/post/upload"}`, {
          //mode: 'no-cors',  mode: 'no-cores'   mode: 'cores'
          method: `${props.method}`,
          // headers: {
          //     "Content-Type": "application/json",
          // },
          body: JSON.stringify(address),
          // body: JSON.stringify(form)
        })
        .then((response) => response.json())
        .then((data) => {form.current?.reset();  setRender((prevRender) => (prevRender++)); alert("stock successfully uploaded")})
        .catch((error) => console.error(error));
      }
      console.log(`about to send to server ${details}`)
      
      submitToServer()
    };


    const handleChange = (e : any)=>{
      const { name, value, files } = e.target;

      if (name === 'file') {
        setDetails((prevFormData) => ({ ...prevFormData, file: files[0] }));
      } else {
        setDetails((prevFormData) => ({ ...prevFormData, [name]: value }));
      }
    }

    
  return (
    <div className='inline'>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">{props.method}</Button>
        </DrawerTrigger>
        <DrawerContent className='flex flex-col justify-center items-center py-5 /bg-red-500 max-w-5xl mx-auto'>
          <form ref={form  as RefObject<HTMLFormElement>} onSubmit={addProduct} className="flex flex-col gap-4 p-5 my-1 bg-secondary rounded-xl max-w-xl">
          <DrawerHeader>
            <DrawerTitle className="text-xl /text-accent mb-2 text-center font-semibold">{props.method} User from <span className='text-accent'>Loyz Collections</span></DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input type="text" name='address' onChange={handleChange} placeholder="Address" className="rounded-sm bg-background" />
          <Input type="text" name="city" onChange={handleChange} placeholder="City" className="rounded-sm bg-background" />
          <Input type="text" name="state" onChange={handleChange} placeholder="State" className="rounded-sm bg-background" />
          <Input type="text" name='zip' onChange={handleChange} placeholder="Zip code" className="rounded-sm bg-background" />
          <Input type="text" name='country' onChange={handleChange} placeholder="Country" className="rounded-sm bg-background" />
        </div>
        <DrawerFooter className="flex flex-row w-full gap-2 mt-2">
                  {/* <Button>Submit</Button> */}
                  <DrawerClose className='flex-1' asChild>
                    <Button className='flex-1' variant="outline">Cancel</Button>
                  </DrawerClose>
                  <Button type="submit" className="flex-1 before:ani-shadow w-full">Submit</Button>
                </DrawerFooter>
    </form>
          {/* <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter> */}
        </DrawerContent>
      </Drawer>
    </div>
  )
}

// const shippingAddressSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
//     street: { type: String},
//     city: { type: String},
//     state: { type: String},
//     zip: { type: String},
//     country: { type: String},
// });

export default AddressForm






export type address = {
  _id: string
  userId: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export const addressColumns: ColumnDef<address>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() 
          // ||
          // (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "userId",
    header: "userId",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("userId")}</div>
    ),
  },
  {
    accessorKey: "street",
    header: "street",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("street")}</div>
    ),
  },
  {
    accessorKey: "city",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          City
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("city")}</div>,
  },
  {
    accessorKey: "state",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          State
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("state")}</div>,
  },
  {
    accessorKey: "zip",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Zip Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("zip")}</div>,
  },
  {
    accessorKey: "country",
    header: "country",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("country")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const address : address = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(address._id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
