import { test } from '../fixtures.ts'
import SimpleDataLoader from './SimpleDataLoader.ts'

test("Load next data", async ({ page, resourcesServer }) => {
  const loader = await SimpleDataLoader.open(page, resourcesServer.simpleDataLoader.url)
  await SimpleDataLoader.DATA.reduce(async (acc) => {
    await acc
    await loader.loadNextData()
  }, Promise.resolve());
})

test("Load unavailable data", async ({ page, resourcesServer }) => {
  const loader = await SimpleDataLoader.open(page, resourcesServer.simpleDataLoader.url)
  await loader.loadUnavailableData()
})
