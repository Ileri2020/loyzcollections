// ... existing imports
import nodemailer from 'nodemailer';

const email = process.env.GOOGLE_EMAIL ?? 'adepojuololade2020@gmail.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD, 
    },
});

export const sendOrderNotification = async (to: string, orderDetails: any) => {
    try {
        console.log('Sending order notification email to:', to);
        
        let guestDetailsHtml = "";
        if (orderDetails.guestDetails) {
            const gd = orderDetails.guestDetails;
            const itemRows = gd.items?.map((item: any) => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₦${item.price.toLocaleString()}</td>
                </tr>
            `).join('') || '';

            guestDetailsHtml = `
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; color: #1f2937;">Customer Details (Guest Checkout)</h3>
                    <p><strong>Name:</strong> ${gd.name}</p>
                    <p><strong>Phone:</strong> ${gd.phone}</p>
                    <p><strong>Email:</strong> ${gd.email || 'N/A'}</p>
                    <p><strong>Shipping Address:</strong> ${gd.address}, ${gd.city}, ${gd.state}</p>
                </div>
                
                <h3 style="color: #1f2937; margin-top: 20px;">Items Ordered</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                    <thead>
                        <tr style="background: #f3f4f6; text-align: left;">
                            <th style="padding: 8px; border-bottom: 2px solid #e5e7eb;">Item</th>
                            <th style="padding: 8px; border-bottom: 2px solid #e5e7eb; text-align: center;">Quantity</th>
                            <th style="padding: 8px; border-bottom: 2px solid #e5e7eb; text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemRows}
                    </tbody>
                </table>
            `;
        }

        const mailOptions = {
            from: email,
            to,
            subject: `New Order Pending Confirmation - ₦${orderDetails.amount.toLocaleString()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
                    <h1 style="color: #ea580c; border-bottom: 2px solid #f97316; padding-bottom: 10px;">New Order Received (Awaiting Confirmation)</h1>
                    <p>Hello Admin,</p>
                    <p>A new order has been placed via Bank Transfer and requires your confirmation.</p>
                    
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                        <h3 style="margin-top: 0; color: #15803d;">Transaction Details</h3>
                        <p><strong>Payment Method:</strong> Bank Transfer</p>
                        <p><strong>Sender/Payee Name:</strong> ${orderDetails.payeeName || 'N/A'}</p>
                        <p><strong>Reference:</strong> ${orderDetails.tx_ref}</p>
                        <p><strong>Total Amount:</strong> <span style="font-size: 18px; font-weight: bold; color: #16a34a;">₦${orderDetails.amount.toLocaleString()}</span></p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    ${guestDetailsHtml}

                    <p>Please log in to the admin panel to confirm this payment once the funds are received in the bank account.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">© 2026 Lois Food and Spices. All rights reserved.</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Order notification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending order notification email:', error);
        return null;
    }
};

export const sendVerificationEmail = async (to: string, code: string, name: string) => {
    try {
        console.log('Sending verification email to:', to);
        const mailOptions = {
            from: email,
            to,
            subject: "Verify Your Email - Lois Food and Spices",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Verify Your Email</h2>
          <p>Hi ${name || "there"},</p>
          <p>You requested to set a password for your Lois Food and Spices account.</p>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #22c55e; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">© 2026 Lois Food and Spices. All rights reserved.</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

export const sendPaymentConfirmationEmail = async (to: string, data: {
    customerName: string;
    contact: string;
    address: string;
    products: any[];
    total: number;
    deliveryFee: number;
    orderId: string;
}) => {
    try {
        console.log('Sending payment confirmation email to:', to);
        const productRows = data.products.map((p: any) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.product.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">₦${p.product.price.toLocaleString()}</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: email,
            to,
            subject: `Order Confirmation - #${data.orderId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22c55e;">Order Confirmed!</h2>
                    <p>Hi ${data.customerName},</p>
                    <p>Your payment has been confirmed and your order is being processed.</p>
                    
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Order Details</h3>
                        <p><strong>Order ID:</strong> ${data.orderId}</p>
                        <p><strong>Delivery Address:</strong> ${data.address}</p>
                        <p><strong>Contact:</strong> ${data.contact}</p>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="text-align: left; background: #f3f4f6;">
                                <th style="padding: 8px;">Product</th>
                                <th style="padding: 8px;">Qty</th>
                                <th style="padding: 8px;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${productRows}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Delivery Fee:</td>
                                <td style="padding: 8px;">₦${data.deliveryFee.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">Total:</td>
                                <td style="padding: 8px; font-weight: bold; color: #22c55e;">₦${data.total.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <p>Thank you for shopping with Lois Food and Spices!</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Payment confirmation email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending payment confirmation email:', error);
        return null;
    }
};

