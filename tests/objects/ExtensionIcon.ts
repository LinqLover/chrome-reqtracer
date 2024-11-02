import { expect, Page } from '@playwright/test'
import { Worker } from 'playwright-core'
import ExtensionPopup from './ExtensionPopup.ts'
import { ExtensionInfo } from '../fixtures.ts'

/** Test object model for the extension icon. */
export default class ExtensionIcon {
  public backgroundWorker: Worker
  public extensionId: string
  constructor(extensionInfo: ExtensionInfo) {
    this.backgroundWorker = extensionInfo.backgroundWorker
    this.extensionId = extensionInfo.extensionId
  }

  async storeCurrentTabId(page: Page) {
    // shortly switch tab forth and back because current tab detection is unreliable before
    const tempPage = await page.context().newPage()
    await tempPage.bringToFront()
    await tempPage.close()
  }

  async getBadgeText() {
    return await this.backgroundWorker.evaluate(
      (tabId) => chrome.action.getBadgeText({ tabId }),
      await this._getCurrentTabId()!
    )
  }

  async openPopup(page: Page) {
    //await this.background.evaluate(() => chrome.action.openPopup())
    // WORKAROUND: Playwright currently lacks access to controlling the popup. Instead, we open the extension manually in a new tab, provide the current tab index via a URL parameter and switch between different tabs as necessary.

    await page.bringToFront()
    const tabId = await this._getCurrentTabId()

    const newPage = await page.context().newPage()
    await newPage.goto(`chrome-extension://${this.extensionId}/src/popup.html?tabId=${tabId}`)
    await expect(newPage.locator('body')).toContainText("Chrome ReqTracer")
    await page.bringToFront()
    return new ExtensionPopup(newPage)
  }

  async _getCurrentTabId() {
    const tabs = await this.backgroundWorker.evaluate(() =>
      chrome.tabs.query({ active: true, currentWindow: true }))
    return tabs[0].id
  }
}
