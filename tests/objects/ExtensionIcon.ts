import { expect, Page } from '@playwright/test'
import ExtensionPopup from './ExtensionPopup.ts'

export default class ExtensionIcon {
  public backgroundWorker: Worker & { evaluate: Page['evaluate'] }
  public extensionId: string
  constructor(extensionInfo: { backgroundWorker: Worker; extensionId: string }) {
    this.backgroundWorker = extensionInfo.backgroundWorker as Worker & { evaluate: Page['evaluate'] }
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
    // WORKAROUND: cannot control the popup

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
