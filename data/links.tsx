import {AiOutlineSearch, AiOutlineHome, AiOutlineShop, AiOutlineMan, AiOutlineContacts, AiOutlineWoman, AiOutlineProfile,AiOutlineHistory} from "react-icons/ai"
import { BiPhoneCall, BiSolidContact, BiPhone,} from "react-icons/bi"
import { CiShoppingCart, } from "react-icons/ci"
import { IoMdHelp } from "react-icons/io";
import { VscAccount } from "react-icons/vsc";
import { IoFastFoodOutline } from "react-icons/io5";




const pageLinks = [
  {
    icon: <AiOutlineHome />,
    path: "/",
    name: "Home",
  },
  {
    icon: <AiOutlineShop />,
    path: "/store",
    name: "Store",
  },
  // {
  //   name: <IoMdHelp />,
  //   path: "/help",
  // },
  // {
  //   name: <IoFastFoodOutline />,
  //   path: "/lunch",
  // },
  {
    icon: <AiOutlineHistory />,
    path: "/about",
    name: "About",
  },
  {
    icon: <BiPhone />,
    path: "/contact",
    name: "Contact",
  },
  {
    icon: <VscAccount />,
    path: "/account",
    name: "Account",
  },
  // {
  //   name: "blogs",
  //   path: "/blogs",
  // },
  // {
  //   name: <CiShoppingCart />,
  //   path: "/cart",
  // },
]

export default { Links: pageLinks }