import { test } from './fixtures'
import SimpleDataLoader from './fixtures/resources/SimpleDataLoader'

test("Load next data", async ({ page, resourcesServer }) => {
  const loader = await SimpleDataLoader.open(page, resourcesServer.loaderUrl)
  await SimpleDataLoader.DATA.reduce(async (acc) => {
    await acc
    await loader.loadNextData()
  }, Promise.resolve());
})

test("Load unavailable data", async ({ page, resourcesServer }) => {
  const loader = await SimpleDataLoader.open(page, resourcesServer.loaderUrl)
  await loader.loadUnavailableData()
})
