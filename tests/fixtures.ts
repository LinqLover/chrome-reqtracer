import * as httpServer from 'http-server'
import { test as base, chromium } from '@playwright/test'
import * as path from 'path'

export const test = base.extend({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../dist')
    const context = await chromium.launchPersistentContext('', {
      headless: false, // required for extension testing
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    })
    await use(context)
    await context.close()
  },

  extension: async ({ context }, use) => {
    let [backgroundWorker] = context.serviceWorkers()
    if (!backgroundWorker)
      backgroundWorker = await context.waitForEvent('serviceworker')

    const extensionId = backgroundWorker.url().split('/')[2]
    // give the extension some time to load
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await use({ extensionId, backgroundWorker })
  },

  resourcesServer: async ({}, use) => {
    const serverPath = path.join(__dirname, 'fixtures/resources')

    const server = httpServer.createServer({ root: serverPath })
    await new Promise<void>((resolve) => server.listen(0 /* choose free port */, resolve))
    const port = (server as any).server.address().port

    const url = `http://localhost:${port}`
    await use({
      loaderUrl: `${url}/simpleDataLoader`,
    })

    //await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()))
    // WORKAROUND: httpServer.close does not forward the callback
    server.close()
  },
})
