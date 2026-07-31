import nodemailer from 'nodemailer';
import type { Config } from '../config';

export interface Mailer {
  enabled: boolean;
  sendMagicLink: (email: string, url: string) => Promise<void>;
}

export function createMailer(config: Config): Mailer {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    return {
      enabled: false,
      sendMagicLink: async () => {
        throw new Error('SMTP non configuré');
      },
    };
  }

  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    auth: { user: config.SMTP_USER, pass: config.SMTP_PASS },
  });

  return {
    enabled: true,
    sendMagicLink: async (email, url) => {
      await transport.sendMail({
        from: config.SMTP_FROM ?? config.SMTP_USER,
        to: email,
        subject: 'Ton lien de connexion Rikiki 🃏',
        text: `Bonjour !\n\nClique sur ce lien pour confirmer ton compte Rikiki :\n${url}\n\nCe lien expire dans 15 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#14532d">Rikiki 🃏</h2>
            <p>Clique sur le bouton pour confirmer ton compte&nbsp;:</p>
            <p style="text-align:center;margin:24px 0">
              <a href="${url}" style="background:#fbbf24;color:#14532d;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:bold">
                Confirmer mon compte
              </a>
            </p>
            <p style="color:#666;font-size:13px">Ce lien expire dans 15 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p>
          </div>`,
      });
    },
  };
}
