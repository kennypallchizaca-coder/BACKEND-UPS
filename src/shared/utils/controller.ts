import type { Core } from '@strapi/strapi';

type ControllerAction<T> = {
  strapi: Core.Strapi;
  ctx: any;
  action: () => Promise<T>;
  logMessage: string;
  clientMessage: string;
};

/**
 * Wrapper genérico para controladores: ejecuta la acción, responde con los datos
 * y maneja errores de forma uniforme.
 */
export async function sendControllerResponse<T>({
  strapi,
  ctx,
  action,
  logMessage,
  clientMessage,
}: ControllerAction<T>) {
  try {
    ctx.body = await action();
  } catch (err) {
    strapi.log.error(logMessage, err);
    ctx.internalServerError(clientMessage);
  }
}
