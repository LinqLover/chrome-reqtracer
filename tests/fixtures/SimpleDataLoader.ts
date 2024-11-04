import { expect, Page } from '@playwright/test'

/** POM for `simpleDataLoader/index.html`. */
export default class SimpleDataLoader {
  static async open(page: Page, url: string) {
    const loader = new SimpleDataLoader(page, url)
    await loader.openPage()
    return loader
  }

  static DATA = [, 'one', 'two', 'three', 'four', 'five']

  pageUrl: string
  constructor(public page: Page, public url: string) {
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
    const button = this.page.getByRole('button', {name: "Load Next Data"})
    await button.click()

    await expect(this.page.locator('//p[last()]')).toHaveText(SimpleDataLoader.DATA[++this.index]!)

    return {
      expectedUrl: `${this.url}/data/${this.index}.txt`,
    }
  }

  async loadUnavailableData() {
    const button = this.page.getByRole('button', {name: "Load Unavailable Data"})
    await button.click()

    await expect(this.page.locator('//p[last()]')).toHaveText("Error 0")

    return {
      expectedUrl: null,
    }
  }
}
