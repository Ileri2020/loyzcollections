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

const escapeHtml = (value: any) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const renderProductRows = (items: any[] = []) => (items || []).map((item: any) => {
    const product = item.product ?? item;
    const imageUrl = product.images?.[0] || product.image || '/placeholder.jpg';
    const name = product.name || item.name || 'Product';
    const quantity = item.quantity ?? 1;
    const price = Number(product.price ?? item.price ?? 0);

    return `
        <tr>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${imageUrl}" alt="${escapeHtml(name)}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;" />
                    <span>${escapeHtml(name)}</span>
                </div>
            </td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${quantity}</td>
            <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₦${price.toLocaleString()}</td>
        </tr>
    `;
}).join('');

export const sendOrderNotification = async (to: string, orderDetails: any) => {
    try {
        console.log('Sending order notification email to:', to);
        
        const itemRows = renderProductRows(orderDetails.guestDetails?.items || orderDetails.items || []);
        let guestDetailsHtml = "";
        if (orderDetails.guestDetails) {
            const gd = orderDetails.guestDetails;
            const deliveryLine = orderDetails.deliveryMethod === 'pickup'
                ? `<p><strong>Pickup Location:</strong> ${escapeHtml(orderDetails.pickupLocation || 'Loyz Collection Pickup Point')}</p>`
                : `<p><strong>Shipping Address:</strong> ${escapeHtml([gd.address, gd.city, gd.state].filter(Boolean).join(', ') || 'N/A')}</p>`;

            guestDetailsHtml = `
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                    <h3 style="margin-top: 0; color: #1f2937;">Customer Details (Guest Checkout)</h3>
                    <p><strong>Name:</strong> ${escapeHtml(gd.name || 'N/A')}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(gd.phone || 'N/A')}</p>
                    <p><strong>Email:</strong> ${escapeHtml(gd.email || 'N/A')}</p>
                    <p><strong>Delivery Method:</strong> ${escapeHtml(orderDetails.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery')}</p>
                    ${deliveryLine}
                </div>
            `;
        }

        const itemsHtml = itemRows ? `
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
        ` : '';

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
                        <p><strong>Delivery Method:</strong> ${orderDetails.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                        ${orderDetails.deliveryMethod === 'pickup'
                            ? `<p><strong>Pickup Location:</strong> ${escapeHtml(orderDetails.pickupLocation || 'Loyz Collection Pickup Point')}</p>`
                            : `<p><strong>Delivery Address:</strong> ${escapeHtml(orderDetails.address || 'N/A')}</p>`}
                        <p><strong>Total Amount:</strong> <span style="font-size: 18px; font-weight: bold; color: #16a34a;">₦${orderDetails.amount.toLocaleString()}</span></p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    ${guestDetailsHtml}

                    <p>Please log in to the admin panel to confirm this payment once the funds are received in the bank account.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">© 2026 Loyz Collection. All rights reserved.</p>
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
            subject: "Verify Your Email - Loyz Collection",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">Verify Your Email</h2>
          <p>Hi ${name || "there"},</p>
          <p>You requested to set a password for your Loyz Collection account.</p>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #22c55e; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">© 2026 Loyz Collection. All rights reserved.</p>
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
    deliveryMethod?: string;
    pickupLocation?: string;
}) => {
    try {
        console.log('Sending payment confirmation email to:', to);
        const productRows = renderProductRows(data.products || []);

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
                        <p><strong>Delivery Method:</strong> ${data.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                        ${data.deliveryMethod === 'pickup'
                            ? `<p><strong>Pickup Location:</strong> ${escapeHtml(data.pickupLocation || 'Loyz Collection Pickup Point')}</p>`
                            : `<p><strong>Delivery Address:</strong> ${escapeHtml(data.address || 'N/A')}</p>`}
                        <p><strong>Contact:</strong> ${escapeHtml(data.contact || 'N/A')}</p>
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

                    <p>Thank you for shopping with Loyz Collection!</p>
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

