'use server';

import nodemailer from 'nodemailer';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send an email using SMTP
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Team Tracker" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, message: `Email sent to ${to}` };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      message: `Error sending email: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Send a group invitation email
 */
export async function sendGroupInvitation({
  email,
  groupName,
  invitedBy,
  loginUrl = 'http://localhost:3000/login',
}: {
  email: string;
  groupName: string;
  invitedBy: string;
  loginUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  const subject = `You've been invited to join ${groupName} on Team Tracker!`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">You've Been Invited!</h2>
      <p>Hello ${email},</p>
      <p>${invitedBy} has invited you to join <strong>${groupName}</strong> on Team Tracker.</p>
      <p>Team Tracker is a fun platform that helps teams collaborate and stay motivated together.</p>
      <div style="margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Join Your Team
        </a>
      </div>
      <p>If you're new to Team Tracker, you'll be able to create an account when you click the link above.</p>
      <p>Looking forward to seeing you there!</p>
      <p>- The Team Tracker Team</p>
    </div>
  `;
  
  return sendEmail({ to: email, subject, html });
}
