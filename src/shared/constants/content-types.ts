// Constantes compartidas con los identificadores y estados usados por las APIs.
export const CONTENT_TYPES = {
  activityLog: 'api::activity-log.activity-log',
  companyRequest: 'api::company-request.company-request',
  emailLog: 'api::email-log.email-log',
  emailSetting: 'api::email-setting.email-setting',
  companyEmailSetting: 'api::company-email-setting.company-email-setting',
  leadEmailTemplate: 'api::email-template.email-template',
  companyEmailTemplate: 'api::company-email-template.company-email-template',
  interestedLead: 'api::lead.lead',
  publication: 'api::publication.publication',
} as const;

export const EMAIL_STATUS = {
  sent: 'Enviado',
  failed: 'Fallido',
} as const;

export const ACTIVITY_LEVEL = {
  info: 'Info',
  warning: 'Advertencia',
  error: 'Error',
  security: 'Seguridad',
} as const;
