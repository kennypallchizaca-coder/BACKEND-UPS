export default {
  routes: [
    {
      method: 'POST',
      path: '/leads/submit',
      handler: 'api::lead.lead.submit',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/leads/:id/send-custom-response',
      handler: 'api::lead.lead.sendCustomResponse',
      config: {},
    },
  ],
};
