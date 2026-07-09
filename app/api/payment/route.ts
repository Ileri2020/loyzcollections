"use server";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { sendOrderNotification, sendPaymentConfirmationEmail } from "@/lib/nodemailer";

const prisma = new PrismaClient();

function generateTxRef() {
  return `TX-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // ?action=confirm
    const body = await req.json();

    // ---------------- CONFIRM PAYMENT ----------------
    // CONFIRM PAYMENT
    if (action === "confirm") {
      const { tx_ref } = body;
      if (!tx_ref)
        return NextResponse.json({ error: "tx_ref is required" }, { status: 400 });

      const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;

      // Fetch transaction from FlutterWave
      const fwRes = await axios.get(
        `https://api.flutterwave.com/v3/transactions?tx_ref=${tx_ref}`,
        { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } }
      );

      const data = fwRes.data?.data?.[0];

      if (!data)
        return NextResponse.json({ success: false, message: "Transaction not found" });

      if (data.status === "successful") {
        // Find payment by tx_ref
        const payment = await prisma.payment.findUnique({ where: { tx_ref } });

        if (payment) {
          // Mark cart as paid
          await prisma.cart.update({
            where: { id: payment.cartId },
            data: { status: "paid" },
          });
          // Send order notification
          // Sending to a test email as requested
          await sendOrderNotification(process.env.ORDER_RECEIVER_EMAIL, {
            tx_ref,
            amount: data.amount,
          });
          await sendOrderNotification('adepojuololade2020@gmail.com', {
            tx_ref,
            amount: data.amount,
          });
        }

        return NextResponse.json({ success: true, message: "Payment confirmed" });
      }

      return NextResponse.json({ success: false, message: "Payment not completed yet" });
    }


    // ---------------- INITIATE PAYMENT ----------------
    const { userId, items, cartId, deliveryFee = 0, name, contact, deliveryMethod, pickupLocation, customerEmail, guestDetails } = body;

    if (!userId || !items?.length) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    let user;
    if (userId === "nil" || userId === "guest") {
      user = await prisma.user.findUnique({ where: { email: "guest@loysfoods.com" } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: "Guest Customer",
            email: "guest@loysfoods.com",
            contact: "Guest",
            role: "customer",
          },
        });
      }
    } else {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (!user.contact || user.contact === "xxxx-xxx-xxxx") {
        return NextResponse.json({
          error: "Please update your contact information before checkout. Go to your account settings to add your phone number."
        }, { status: 400 });
      }
    }

    const selectedDeliveryMethod = deliveryMethod === "pickup" ? "pickup" : "delivery";
    const resolvedPickupLocation = pickupLocation || process.env.PICKUP_LOCATION || "Loyz Collection Pickup Point";

    // Calculate subtotal server-side
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: any) => i.productId) } },
    });
    const subtotal = items.reduce((sum: number, item: any) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    // Add delivery fee to get total
    const total = subtotal + Number(deliveryFee);

    let cart;
    if (cartId) {
      const existingCart = await prisma.cart.findFirst({ where: { id: cartId, userId: user.id, status: "pending" } });
      if (!existingCart) return NextResponse.json({ error: "Cart not found or already processed" }, { status: 404 });

      await prisma.cartItem.deleteMany({ where: { cartId } });

      cart = await prisma.cart.update({
        where: { id: cartId },
        data: {
          total,
          deliveryFee: Number(deliveryFee),
          name: name || undefined,
          contact: contact || undefined,
          products: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })) },
        },
      });
    } else {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
          total,
          deliveryFee: Number(deliveryFee),
          status: "pending",
          name: name || "Guest Customer",
          contact: contact || "Guest Contact",
          products: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })) },
        },
      });
    }

    // Create payment record
    const tx_ref = generateTxRef();
    await prisma.payment.create({
      data: { cartId: cart.id, tx_ref, method: "bank_transfer", amount: total },
    });

    const orderProducts = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        product: {
          ...product,
          images: product?.images ?? [],
        },
        quantity: item.quantity,
      };
    });

    const customerName = name || user.name || "Customer";
    const resolvedContact = contact || user.contact || "N/A";
    const deliveryAddress = selectedDeliveryMethod === "pickup"
      ? `Pickup Location: ${resolvedPickupLocation}`
      : (guestDetails ? `${guestDetails.address || ''}, ${guestDetails.city || ''}, ${guestDetails.state || ''}`.trim() : "Address on file");

    if (customerEmail) {
      await sendPaymentConfirmationEmail(customerEmail, {
        customerName,
        contact: resolvedContact,
        address: deliveryAddress,
        products: orderProducts,
        total,
        deliveryFee: Number(deliveryFee),
        orderId: cart.id,
        deliveryMethod: selectedDeliveryMethod,
        pickupLocation: resolvedPickupLocation,
      });
    }

    await sendOrderNotification(process.env.ORDER_RECEIVER_EMAIL, {
      tx_ref,
      amount: total,
      deliveryMethod: selectedDeliveryMethod,
      pickupLocation: resolvedPickupLocation,
      address: deliveryAddress,
      payeeName: customerName,
      guestDetails: userId === "nil" || userId === "guest"
        ? {
            name: guestDetails?.name || customerName,
            phone: guestDetails?.phone || resolvedContact,
            email: customerEmail || guestDetails?.email || "N/A",
            address: guestDetails?.address || "",
            city: guestDetails?.city || "",
            state: guestDetails?.state || "",
            items: orderProducts.map((item: any) => ({
              ...item,
              name: item.product?.name,
              price: item.product?.price,
              images: item.product?.images,
            })),
          }
        : undefined,
      items: orderProducts.map((item: any) => ({
        ...item,
        name: item.product?.name,
        price: item.product?.price,
        images: item.product?.images,
      })),
    });
    await sendOrderNotification('adepojuololade2020@gmail.com', {
      tx_ref,
      amount: total,
      deliveryMethod: selectedDeliveryMethod,
      pickupLocation: resolvedPickupLocation,
      address: deliveryAddress,
      payeeName: customerName,
      guestDetails: userId === "nil" || userId === "guest"
        ? {
            name: guestDetails?.name || customerName,
            phone: guestDetails?.phone || resolvedContact,
            email: customerEmail || guestDetails?.email || "N/A",
            address: guestDetails?.address || "",
            city: guestDetails?.city || "",
            state: guestDetails?.state || "",
            items: orderProducts.map((item: any) => ({
              ...item,
              name: item.product?.name,
              price: item.product?.price,
              images: item.product?.images,
            })),
          }
        : undefined,
      items: orderProducts.map((item: any) => ({
        ...item,
        name: item.product?.name,
        price: item.product?.price,
        images: item.product?.images,
      })),
    });

    return NextResponse.json({ cartId: cart.id, tx_ref, amount: total, currency: "NGN" });
  } catch (error) {
    console.error("Payment failed:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
