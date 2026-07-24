// Punto de entrada de Strapi para registrar extensiones y cargar datos iniciales.
import type { Core } from '@strapi/strapi';

const REQUIRED_PRODUCTION_ENV = [
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'TRANSFER_TOKEN_SALT',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'CORS_ORIGINS',
] as const;

function hasUnsafeValue(value: string | undefined): boolean {
  return !value || /change-with|tobemodified|example\.com/i.test(value);
}

function validateProductionEnvironment() {
  if (process.env.NODE_ENV !== 'production') return;

  const missingOrUnsafe = REQUIRED_PRODUCTION_ENV.filter((key) => hasUnsafeValue(process.env[key]));

  if (missingOrUnsafe.length > 0) {
    throw new Error(`Missing or unsafe production environment values: ${missingOrUnsafe.join(', ')}`);
  }

  if (process.env.DATABASE_CLIENT === 'sqlite') {
    throw new Error('SQLite is not recommended for production. Configure PostgreSQL or MySQL.');
  }

  if (process.env.CORS_ORIGINS?.includes('localhost') || process.env.CORS_ORIGINS?.includes('127.0.0.1')) {
    throw new Error('CORS_ORIGINS must use real production domains, not localhost.');
  }
}

async function ensurePublicReadPermission(strapi: Core.Strapi, actions: string[]) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) return;

  await Promise.all(
    actions.map(async (action) => {
      const existingPermission = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: {
          action,
          role: publicRole.id,
        },
      });

      if (existingPermission) return;

      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action,
          role: publicRole.id,
        },
      });
    })
  );
}

async function seedDefaultEmailTemplates(strapi: Core.Strapi) {
  const leadTemplates = [
    {
      code: 'lead_confirmation',
      subject: 'Solicitud recibida',
      body: 'Hola {{nombre}},\n\nHemos recibido tu solicitud correctamente. Nuestro equipo de admisiones revisará la información enviada y te contactará pronto con una respuesta personalizada.\n\nGracias por comunicarte con nosotros.'
    },
    {
      code: 'admissions_notification',
      subject: 'Nueva solicitud de información recibida',
      body: 'Se ha recibido una nueva solicitud de información.\n\nDatos del interesado:\n\nNombre: {{nombre}}\nApellido: {{apellido}}\nCorreo: {{email}}\nTeléfono: {{telefono}}\nPrograma de interés: {{programaInteres}}\nMensaje: {{mensaje}}\nFuente: {{source}}\n\nPor favor revisar la solicitud desde el panel de administración.'
    },
    {
      code: 'admissions_custom_response',
      subject: 'Información solicitada sobre el programa',
      body: 'Hola {{nombre}},\n\nGracias por tu interés en nuestro programa de {{programaInteres}}.\n\n[Escribe tu respuesta personalizada aquí]\n\nAtentamente,\nEquipo de Admisiones'
    }
  ];

  const companyTemplates = [
    {
      code: 'company_confirmation',
      subject: 'Hemos recibido su solicitud de vinculación institucional',
      body: 'Estimado/a {{contacto}},\n\nHemos recibido la solicitud de vinculación de {{empresa}} correctamente. Nuestro equipo revisará la información enviada y se pondrá en contacto con usted a la brevedad posible.\n\nGracias por su interés en colaborar con nosotros.\n\nAtentamente,\nDirección de Vinculación con la Sociedad'
    },
    {
      code: 'company_admin_notification',
      subject: 'Nueva solicitud de vinculación empresarial: {{empresa}}',
      body: 'Se ha recibido una nueva solicitud de vinculación empresarial.\n\nDatos de la empresa:\n\nEmpresa: {{empresa}}\nContacto: {{contacto}}\nCorreo: {{correo}}\nTeléfono: {{telefono}}\nTipo de colaboración: {{tipo_colaboracion}}\nMensaje: {{mensaje}}\n\nPor favor revisar la solicitud desde el panel de administración.'
    },
    {
      code: 'company_custom_response',
      subject: 'Respuesta a solicitud de vinculación - UPS',
      body: 'Estimado/a {{contacto}},\n\nAgradecemos el interés de {{empresa}} en colaborar con nosotros.\n\n[Escribe tu respuesta personalizada aquí]\n\nAtentamente,\nDirección de Vinculación con la Sociedad'
    }
  ];

  // 1. Seed Lead templates in email-template (Admisiones)
  for (const t of leadTemplates) {
    try {
      const existing = await strapi.documents('api::email-template.email-template').findFirst({
        filters: { code: t.code }
      });

      if (!existing) {
        await strapi.documents('api::email-template.email-template').create({
          data: t
        });
        strapi.log.info(`Lead email template '${t.code}' seeded successfully.`);
      }
    } catch (err) {
      strapi.log.error(`Failed to seed lead email template '${t.code}':`, err);
    }
  }

  // 2. Clean up old company templates from email-template (Admisiones)
  for (const t of companyTemplates) {
    try {
      const existing = await strapi.documents('api::email-template.email-template').findFirst({
        filters: { code: t.code }
      });
      if (existing) {
        await strapi.documents('api::email-template.email-template').delete({
          documentId: existing.documentId
        });
        strapi.log.info(`Cleaned up old company template '${t.code}' from admissions templates.`);
      }
    } catch (err) {
      strapi.log.error(`Failed to clean up old company template '${t.code}':`, err);
    }
  }

  // 3. Seed Company templates in company-email-template (Empresas)
  for (const t of companyTemplates) {
    try {
      const existing = await strapi.documents('api::company-email-template.company-email-template').findFirst({
        filters: { code: t.code }
      });

      if (!existing) {
        await strapi.documents('api::company-email-template.company-email-template').create({
          data: t
        });
        strapi.log.info(`Company email template '${t.code}' seeded successfully.`);
      }
    } catch (err) {
      strapi.log.error(`Failed to seed company email template '${t.code}':`, err);
    }
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {
    validateProductionEnvironment();
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensurePublicReadPermission(strapi, [
      'api::success-case.success-case.find',
      'api::success-case.success-case.findOne',
      'api::lead.lead.submit',
      'api::company-request.company-request.create',
    ]);

    await seedDefaultEmailTemplates(strapi);

    // Iniciar el scheduler de verificación de base de datos (cada 2 horas).
    // Envuelto en try-catch para que un fallo en HealthDB nunca impida el arranque del servidor.
    try {
      await strapi.service('api::health-db.health-db').startScheduler();
    } catch (err) {
      strapi.log.error('[HealthDB] No se pudo iniciar el scheduler — el servidor continúa sin health checks automáticos:', err);
    }
  },

  /**
   * Hook que se ejecuta al detener el servidor.
   * Libera recursos como intervalos y conexiones.
   */
  destroy({ strapi }: { strapi: Core.Strapi }) {
    try {
      strapi.service('api::health-db.health-db').stopScheduler();
    } catch (err) {
      strapi.log.error('[HealthDB] Error al detener el scheduler:', err);
    }
  },
};
