import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../src/config';
import { createMailer, detectProvider, parseAddress } from '../src/mail/mailer';

function config(env: Record<string, string | undefined>) {
  return loadConfig({ JWT_SECRET: 'secret-de-test', ...env } as NodeJS.ProcessEnv);
}

/** Les fournisseurs HTTPS et le repli console écrivent tous sur la console. */
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Remplace `fetch` et retient l'appel émis par le fournisseur. */
function captureFetch(response: Partial<Response> = { ok: true, status: 200 }) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return { statusText: '', text: async () => '', ...response } as Response;
  });
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('choix du fournisseur', () => {
  it('déduit Resend, Brevo puis SMTP dans cet ordre', () => {
    expect(detectProvider(config({ NODE_ENV: 'production', RESEND_API_KEY: 're_x', BREVO_API_KEY: 'xkeysib-x' }))).toBe(
      'resend',
    );
    expect(detectProvider(config({ NODE_ENV: 'production', BREVO_API_KEY: 'xkeysib-x' }))).toBe('brevo');
    expect(
      detectProvider(
        config({ NODE_ENV: 'production', SMTP_HOST: 'smtp.exemple.fr', SMTP_USER: 'u', SMTP_PASS: 'p' }),
      ),
    ).toBe('smtp');
  });

  it('respecte MAIL_PROVIDER même si une autre clé est présente', () => {
    expect(detectProvider(config({ MAIL_PROVIDER: 'console', RESEND_API_KEY: 're_x' }))).toBe('console');
  });

  it('désactive l’envoi en production sans configuration, et bascule sur la console ailleurs', () => {
    expect(detectProvider(config({ NODE_ENV: 'production' }))).toBe('none');
    expect(detectProvider(config({ NODE_ENV: 'development' }))).toBe('console');
  });

  it('traite une variable vide comme absente', () => {
    // Docker Compose transmet « MAIL_PROVIDER= » comme chaîne vide : sans
    // nettoyage, l’énumération refuserait la valeur et le serveur ne démarrerait pas.
    expect(detectProvider(config({ NODE_ENV: 'production', MAIL_PROVIDER: '', RESEND_API_KEY: '  ' }))).toBe('none');
    expect(config({ SMTP_PORT: '' }).SMTP_PORT).toBe(465);
  });

  it('n’active pas SMTP avec des identifiants incomplets', () => {
    const mailer = createMailer(config({ NODE_ENV: 'production', MAIL_PROVIDER: 'smtp', SMTP_HOST: 'smtp.exemple.fr' }));
    expect(mailer.enabled).toBe(false);
    expect(mailer.provider).toBe('none');
  });
});

describe('expéditeur', () => {
  it('sépare le nom de l’adresse', () => {
    expect(parseAddress('Rikiki <no-reply@exemple.fr>')).toEqual({ name: 'Rikiki', email: 'no-reply@exemple.fr' });
    expect(parseAddress('"Rikiki 🃏" <no-reply@exemple.fr>')).toEqual({
      name: 'Rikiki 🃏',
      email: 'no-reply@exemple.fr',
    });
    expect(parseAddress('no-reply@exemple.fr')).toEqual({ email: 'no-reply@exemple.fr' });
  });
});

describe('Resend', () => {
  it('poste le lien sur l’API avec la clé en en-tête', async () => {
    const calls = captureFetch();
    const mailer = createMailer(
      config({ RESEND_API_KEY: 're_test', MAIL_FROM: 'Rikiki <no-reply@exemple.fr>' }),
    );
    expect(mailer.provider).toBe('resend');

    await mailer.sendMagicLink('joueuse@exemple.fr', 'https://rikiki.test/verify?t=jeton');

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.resend.com/emails');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer re_test');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.from).toBe('Rikiki <no-reply@exemple.fr>');
    expect(body.to).toEqual(['joueuse@exemple.fr']);
    expect(body.html).toContain('https://rikiki.test/verify?t=jeton');
    expect(body.text).toContain('https://rikiki.test/verify?t=jeton');
  });

  it('remonte le motif exact d’un refus de l’API', async () => {
    captureFetch({ ok: false, status: 403, statusText: 'Forbidden', text: async () => 'domaine non vérifié' });
    const mailer = createMailer(config({ RESEND_API_KEY: 're_test', MAIL_FROM: 'x@exemple.fr' }));
    // Sans le corps de la réponse, l’exploitant n’a aucun moyen de savoir
    // que c’est le domaine — et non la clé — qui bloque l’envoi.
    await expect(mailer.sendMagicLink('joueuse@exemple.fr', 'https://rikiki.test/verify?t=j')).rejects.toThrow(
      /403.*domaine non vérifié/,
    );
  });

  it('retombe sur l’expéditeur bac à sable sans MAIL_FROM', async () => {
    const calls = captureFetch();
    const mailer = createMailer(config({ RESEND_API_KEY: 're_test' }));
    await mailer.sendMagicLink('joueuse@exemple.fr', 'https://rikiki.test/verify?t=j');
    expect(JSON.parse(String(calls[0].init.body)).from).toContain('onboarding@resend.dev');
  });
});

describe('Brevo', () => {
  it('poste le lien au format attendu par l’API', async () => {
    const calls = captureFetch({ ok: true, status: 201 });
    const mailer = createMailer(config({ BREVO_API_KEY: 'xkeysib-test', MAIL_FROM: 'Rikiki <no-reply@exemple.fr>' }));
    expect(mailer.provider).toBe('brevo');

    await mailer.sendMagicLink('joueuse@exemple.fr', 'https://rikiki.test/verify?t=jeton');

    expect(calls[0].url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((calls[0].init.headers as Record<string, string>)['api-key']).toBe('xkeysib-test');
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.sender).toEqual({ name: 'Rikiki', email: 'no-reply@exemple.fr' });
    expect(body.to).toEqual([{ email: 'joueuse@exemple.fr' }]);
    expect(body.htmlContent).toContain('https://rikiki.test/verify?t=jeton');
  });

  it('refuse de s’activer sans expéditeur — Brevo l’exige', () => {
    const mailer = createMailer(config({ BREVO_API_KEY: 'xkeysib-test' }));
    expect(mailer.enabled).toBe(false);
  });
});

describe('console', () => {
  it('écrit le lien dans les journaux sans rien envoyer', async () => {
    const calls = captureFetch();
    const mailer = createMailer(config({ MAIL_PROVIDER: 'console' }));
    await mailer.sendMagicLink('joueuse@exemple.fr', 'https://rikiki.test/verify?t=jeton');
    expect(calls).toHaveLength(0);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('https://rikiki.test/verify?t=jeton'));
  });
});
