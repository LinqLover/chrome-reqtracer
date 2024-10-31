import { test } from './fixtures'
import SimpleDataLoader from './fixtures/resources/SimpleDataLoader'

test("crash test", async ({ page, resourcesServer }) => {
  const loader = await SimpleDataLoader.open(page, resourcesServer.loaderUrl)
  await SimpleDataLoader.DATA.reduce(async (acc) => {
    await acc
    await loader.loadNextData()
  }, Promise.resolve());
})
