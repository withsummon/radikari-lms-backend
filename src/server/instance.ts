import { cronServer } from './cron';
import createRestServer from './rest';

const server = {
  restServer: createRestServer,
  cronServer: cronServer
}

export default server