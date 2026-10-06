

export interface EmailRecipient {
    email: string;
    name?: string;
}

export interface SendEmailOptions {
    to: string | EmailRecipient | (string | EmailRecipient)[];
    from?: string | EmailRecipient;
    subject: string;
    text?: string;
    html?: string;
    cc?: string | EmailRecipient | (string | EmailRecipient)[];
    bcc?: string | EmailRecipient | (string | EmailRecipient)[];
    replyTo?: string | EmailRecipient;
    headers?: Record<string, string>;
}

export async function sendEmail(
    emailBinding: SendEmail,
    options: SendEmailOptions,
    defaultFrom?: string | EmailRecipient
): Promise<EmailSendResult> {
    const from = options.from || defaultFrom;
    if (!from) {
        throw new Error("Sender email ('from') must be provided in options or defaultFrom.");
    }

    const message = {
        ...options,
        from,
    } as EmailMessageBuilder;

    try {
        return await emailBinding.send(message);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("Failed to send email:", message);
        throw error;
    }
}
