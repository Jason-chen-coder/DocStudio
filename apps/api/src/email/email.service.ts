import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly from =
    process.env.SMTP_FROM || '"DocStudio" <noreply@docstudio.app>';
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });
  }

  private getTemplate(name: string): Handlebars.TemplateDelegate {
    if (this.templateCache.has(name)) {
      return this.templateCache.get(name)!;
    }
    const templatePath = join(__dirname, 'templates', `${name}.hbs`);
    const source = readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(source);
    this.templateCache.set(name, compiled);
    return compiled;
  }

  private async sendMail(to: string, subject: string, templateName: string, context: Record<string, any>) {
    try {
      const template = this.getTemplate(templateName);
      const html = template(context);
      await this.transporter.sendMail({ from: this.from, to, subject, html });
      this.logger.log(`Email [${templateName}] sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email [${templateName}] to ${to}`, error);
    }
  }

  /** 发送邮箱验证邮件 */
  async sendEmailVerification(email: string, name: string, token: string) {
    const url = `${this.frontendUrl}/auth/verify-email?token=${token}`;
    await this.sendMail(email, '验证你的 DocStudio 邮箱', 'email-verification', { name, url });
  }

  /** 发送密码重置邮件 */
  async sendPasswordReset(email: string, name: string, token: string) {
    const url = `${this.frontendUrl}/auth/reset-password?token=${token}`;
    await this.sendMail(email, '重置你的 DocStudio 密码', 'password-reset', { name, url });
  }

  /** 发送欢迎邮件 */
  async sendWelcome(email: string, name: string) {
    const url = `${this.frontendUrl}/dashboard`;
    await this.sendMail(email, '欢迎加入 DocStudio！', 'welcome', { name, url });
  }

  /** 发送通用通知邮件 */
  async sendNotification(
    email: string,
    name: string,
    subject: string,
    message: string,
    actionUrl?: string,
    actionText?: string,
  ) {
    await this.sendMail(email, subject, 'notification', { name, message, actionUrl, actionText });
  }
}
