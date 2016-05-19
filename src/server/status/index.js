import _ from 'lodash';
import ServerStatus from './server_status';
import wrapAuthConfig from './wrap_auth_config';
import { join } from 'path';

module.exports = function (kbnServer, server, config) {

  kbnServer.status = new ServerStatus(kbnServer.server);

  if (server.plugins.good) {
    kbnServer.mixin(require('./metrics'));
  }

  const wrapAuth = wrapAuthConfig(config.get('status.allowAnonymous'));

  server.route(wrapAuth({
    method: 'GET',
    path: '/api/status',
    handler: function (request, reply) {
      return reply({
        name: config.get('server.name'),
        uuid: config.get('uuid'),
        status: kbnServer.status.toJSON(),
        metrics: kbnServer.metrics
      });
    }
  }));

  server.decorate('reply', 'renderStatusPage', function () {
    let app = kbnServer.uiExports.getHiddenApp('status_page');
    let resp = app ? this.renderApp(app) : this(kbnServer.status.toString());
    resp.code(kbnServer.status.isGreen() ? 200 : 503);
    return resp;
  });

  server.route(wrapAuth({
    method: 'GET',
    path: '/status',
    handler: function (request, reply) {
      return reply.renderStatusPage();
    }
  }));
};