import { expect } from '@playwright/test'

export default class SimpleDataLoader {
  static async open(page, url) {
    const loader = new SimpleDataLoader(page, url)
    await loader.openPage()
    return loader
  }

  static DATA = [, 'one', 'two', 'three', 'four', 'five']

  constructor(page, url) {
    this.page = page
    this.url = url
    this.pageUrl = `${this.url}/`
  }

  index = 0

  async openPage(openAction = () => this.page.goto(this.pageUrl)) {
    await openAction()
    await this.page.waitForLoadState('networkidle')
    await expect(this.page.locator('body')).toContainText("Loader")
  }

  async reloadPage() {
    await this.openPage(() => this.page.reload())
  }

  async loadNextData() {
    await this.page.click('button')
    await expect(this.page.locator('body')).toContainText(SimpleDataLoader.DATA[++this.index])

    return {
      expectedUrl: `${this.url}/data/${this.index}.txt`,
    }
  }
}
