import type { Schema, Struct } from '@strapi/strapi';

export interface SharedSection extends Struct.ComponentSchema {
  collectionName: 'components_shared_sections';
  info: {
    description: 'Estructura base para secciones de la landing page.';
    displayName: 'Secci\u00F3n de landing';
    icon: 'layout';
  };
  attributes: {
    activo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    descripcion: Schema.Attribute.RichText;
    titulo: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: 'Enlace a redes sociales con plataforma y URL.';
    displayName: 'Enlace Social';
    icon: 'share-2';
  };
  attributes: {
    plataforma: Schema.Attribute.Enumeration<
      ['facebook', 'instagram', 'tiktok', 'x', 'youtube', 'web']
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.section': SharedSection;
      'shared.social-link': SharedSocialLink;
    }
  }
}
