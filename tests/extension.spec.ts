import { expect } from '@playwright/test'
import { test } from './fixtures.ts'
import SimpleDataLoader from './fixtures/SimpleDataLoader.ts'
import ExtensionIcon from './objects/ExtensionIcon.js'
import { RowSpec } from './objects/ExtensionPopup.ts'

let loader: SimpleDataLoader, icon: ExtensionIcon
test.beforeEach(async ({ page, extension, resourcesServer }) => {
  loader = await SimpleDataLoader.open(page, resourcesServer.simpleDataLoader.url)

  icon = new ExtensionIcon(extension)
  await icon.storeCurrentTabId(page)
})
const secondsPattern = /^\d+\.\d{3}s$/

test("should trace initial request", async ({ page }) => {
  expect(await icon.getBadgeText()).toBe("1")

  const popup = await icon.openPopup(page)
  expect(await popup.waitForRows([
    [secondsPattern, 'GET', loader.pageUrl],
  ]))
})

test("should not trace unsuccessful request", async ({ page }) => {
  const popup = await icon.openPopup(page)
  await loader.loadUnavailableData()
  expect(await icon.getBadgeText()).toBe("1")
  expect(await popup.waitForRows([
    [secondsPattern, 'GET', loader.pageUrl],
  ]))
})

test("should trace dynamic requests", async ({ page }) => {
  const popup = await icon.openPopup(page)

  const expectedRows: RowSpec[] = [
    [secondsPattern, 'GET', loader.pageUrl],
  ]
  for (let i = 1; i <= 3; i++) {
    const { expectedUrl } = await loader.loadNextData()
    expect(await icon.getBadgeText()).toBe((i + 1).toString())
    expectedRows.push([secondsPattern, 'GET', expectedUrl])
    expect(await popup.waitForRows(expectedRows))
  }
})

test("should trace requests for navigation (reload)", async ({ page }) => {
  const popup = await icon.openPopup(page)

  const expectedRows: RowSpec[] = [
    [secondsPattern, 'GET', loader.pageUrl],
  ]
  await loader.reloadPage()
  expect(await icon.getBadgeText()).toBe("2")
  expectedRows.push([secondsPattern, 'GET', loader.pageUrl])
  expect(await popup.waitForRows(expectedRows))

  // new dynamic request
  const { expectedUrl } = await loader.loadNextData()
  expect(await icon.getBadgeText()).toBe("3")
  expectedRows.push([secondsPattern, 'GET', expectedUrl])
  expect(await popup.waitForRows(expectedRows))
})

test("should clear requests", async ({ page }) => {
  const popup = await icon.openPopup(page)

  await popup.clearRequests()
  expect(await icon.getBadgeText()).toBe("0")
  expect(await popup.waitForRows([]))

  // new dynamic request
  const { expectedUrl } = await loader.loadNextData()
  expect(await icon.getBadgeText()).toBe("1")
  expect(await popup.waitForRows([
    [secondsPattern, 'GET', expectedUrl],
  ]))
})
