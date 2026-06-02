import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { QUEUE_NAMES } from '../queue.constants';
import { NotificationJobData } from '../queue.service';
import { ConfigService } from '@nestjs/config';

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor {
  constructor(private configService: ConfigService) {}

  @Process('notify')
  async handleNotification(job: Job<NotificationJobData>) {
    const { type, recipient, template, data } = job.data;

    try {
      await job.progress(10);

      switch (type) {
        case 'email':
          await this.sendEmail(recipient, template, data);
          break;
        case 'push':
          await this.sendPushNotification(recipient, template, data);
          break;
        case 'sms':
          await this.sendSMS(recipient, template, data);
          break;
        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      await job.progress(100);

      return {
        success: true,
        type,
        recipient,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Notification processing error:', error);
      throw error;
    }
  }

  private async sendEmail(recipient: string, template: string, data: Record<string, any>): Promise<void> {
    // Email implementation would go here
    // Using nodemailer or similar

    const smtpHost = this.configService.get<string>('SMTP_HOST');

    if (!smtpHost) {
      console.log(`[EMAIL MOCK] Would send email to ${recipient}`);
      console.log(`Template: ${template}`);
      console.log(`Data:`, data);
      return;
    }

    // Actual email sending logic would be here
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({...});

    console.log(`Email sent to ${recipient} using template ${template}`);
  }

  private async sendPushNotification(recipient: string, template: string, data: Record<string, any>): Promise<void> {
    // Push notification implementation would go here
    // Using Firebase, OneSignal, or similar

    console.log(`[PUSH MOCK] Would send push to ${recipient}`);
    console.log(`Template: ${template}`);
    console.log(`Data:`, data);
  }

  private async sendSMS(recipient: string, template: string, data: Record<string, any>): Promise<void> {
    // SMS implementation would go here
    // Using Twilio, Nexmo, or similar

    console.log(`[SMS MOCK] Would send SMS to ${recipient}`);
    console.log(`Template: ${template}`);
    console.log(`Data:`, data);
  }

  @OnQueueActive()
  onActive(job: Job<NotificationJobData>) {
    console.log(`Processing notification job ${job.id}: ${job.data.type} to ${job.data.recipient}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<NotificationJobData>, result: any) {
    console.log(`Notification job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job<NotificationJobData>, error: Error) {
    console.error(`Notification job ${job.id} failed:`, error.message);
  }
}
