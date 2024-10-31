import { expect } from '@playwright/test'
import ExtensionPopup from './ExtensionPopup.js'

export default class ExtensionIcon {
  constructor(extensionInfo) {
    this.background = extensionInfo.background
    this.extensionId = extensionInfo.extensionId
  }

  async storeCurrentTabId(page) {
    // shortly switch tab forth and back because current tab detection is unreliable before
    const tempPage = await page.context().newPage()
    await tempPage.bringToFront()
    await tempPage.close()
  }

  async getBadgeText() {
    return await this.background.evaluate(
      (tabId) => chrome.action.getBadgeText({ tabId }),
      await this._getCurrentTabId()
    )
  }

  async openPopup(page) {
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
    const tabs = await this.background.evaluate(() =>
      chrome.tabs.query({ active: true, currentWindow: true }))
    return tabs[0].id
  }
}
