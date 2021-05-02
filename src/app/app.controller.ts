import { controller, IAppController } from '@foal/core'
// import { createConnection } from 'typeorm'

import { ApiController } from './controllers'

export class AppController implements IAppController {
  subControllers = [
    controller('/apia', ApiController),
  ];

  async init() {
    // await createConnection()
  }
}
