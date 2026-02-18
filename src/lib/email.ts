import { Resend } from "resend";

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
}

function getFromAddress() {
    return process.env.RESEND_FROM_EMAIL || "UrbanEstate <no-reply@urbanestate.app>";
}

function getAdminAddress() {
    return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL || null;
}

export async function sendAdminNewVisitRequestEmail(params: {
    propertyTitle: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    requestedDate?: string | null;
    requestedTime?: string | null;
}) {
    const resend = getResendClient();
    const to = getAdminAddress();
    if (!resend || !to) return;

    await resend.emails.send({
        from: getFromAddress(),
        to,
        subject: `New visit request: ${params.propertyTitle}`,
        html: `
            <p>A new property visit request was submitted and is waiting for admin approval.</p>
            <ul>
              <li><strong>Property:</strong> ${params.propertyTitle}</li>
              <li><strong>Customer:</strong> ${params.customerName}</li>
              <li><strong>Phone:</strong> ${params.customerPhone}</li>
              <li><strong>Email:</strong> ${params.customerEmail || "-"}</li>
              <li><strong>Date:</strong> ${params.requestedDate || "-"}</li>
              <li><strong>Time:</strong> ${params.requestedTime || "-"}</li>
            </ul>
            <p>Review this request in the admin dashboard.</p>
        `,
    });
}

export async function sendVisitReceivedEmail(params: {
    customerEmail?: string | null;
    customerName: string;
    propertyTitle: string;
}) {
    if (!params.customerEmail) return;

    const resend = getResendClient();
    if (!resend) return;

    await resend.emails.send({
        from: getFromAddress(),
        to: params.customerEmail,
        subject: "We received your visit request",
        html: `
            <p>Hi ${params.customerName},</p>
            <p>Thanks for requesting a visit for <strong>${params.propertyTitle}</strong>.</p>
            <p>Your request is under review. You will receive a confirmation email once approved.</p>
        `,
    });
}

export async function sendVisitApprovedEmail(params: {
    customerEmail?: string | null;
    customerName: string;
    propertyTitle: string;
    requestedDate?: string | null;
    requestedTime?: string | null;
}) {
    if (!params.customerEmail) return;

    const resend = getResendClient();
    if (!resend) return;

    await resend.emails.send({
        from: getFromAddress(),
        to: params.customerEmail,
        subject: "Your property visit is confirmed",
        html: `
            <p>Hi ${params.customerName},</p>
            <p>Your visit request for <strong>${params.propertyTitle}</strong> has been approved.</p>
            <ul>
              <li><strong>Date:</strong> ${params.requestedDate || "-"}</li>
              <li><strong>Time:</strong> ${params.requestedTime || "-"}</li>
            </ul>
            <p>Please arrive on time. Reply to this email if you need help.</p>
        `,
    });
}

export async function sendAdminNewMarketplaceRequestEmail(params: {
    itemTitle: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
}) {
    const resend = getResendClient();
    const to = getAdminAddress();
    if (!resend || !to) return;

    await resend.emails.send({
        from: getFromAddress(),
        to,
        subject: `New marketplace request: ${params.itemTitle}`,
        html: `
            <p>A new marketplace request is pending admin approval.</p>
            <ul>
              <li><strong>Item:</strong> ${params.itemTitle}</li>
              <li><strong>Customer:</strong> ${params.customerName}</li>
              <li><strong>Phone:</strong> ${params.customerPhone}</li>
              <li><strong>Email:</strong> ${params.customerEmail || "-"}</li>
            </ul>
            <p>Review this request in the admin dashboard.</p>
        `,
    });
}

export async function sendMarketplaceReceivedEmail(params: {
    customerEmail?: string | null;
    customerName: string;
    itemTitle: string;
}) {
    if (!params.customerEmail) return;

    const resend = getResendClient();
    if (!resend) return;

    await resend.emails.send({
        from: getFromAddress(),
        to: params.customerEmail,
        subject: "We received your marketplace request",
        html: `
            <p>Hi ${params.customerName},</p>
            <p>Thanks for your interest in <strong>${params.itemTitle}</strong>.</p>
            <p>Your request is under review. You will receive a confirmation email once approved.</p>
        `,
    });
}

export async function sendMarketplaceApprovedEmail(params: {
    customerEmail?: string | null;
    customerName: string;
    itemTitle: string;
}) {
    if (!params.customerEmail) return;

    const resend = getResendClient();
    if (!resend) return;

    await resend.emails.send({
        from: getFromAddress(),
        to: params.customerEmail,
        subject: "Your marketplace request is confirmed",
        html: `
            <p>Hi ${params.customerName},</p>
            <p>Your request for <strong>${params.itemTitle}</strong> has been approved.</p>
            <p>Our team will contact you shortly with next steps.</p>
        `,
    });
}
