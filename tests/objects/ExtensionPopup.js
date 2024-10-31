import { expect } from '@playwright/test'
import { agGridTest } from '../vendor/agGridUtils'

export default class ExtensionPopup {
  constructor(page) {
    this.page = page
    this.gridTest = agGridTest(this.page)
  }

  async clearRequests() {
    await this.page.click('#clear-requests-button')
  }

  async waitForRows(rowSpecs = undefined) {
    if (!(rowSpecs !== undefined && rowSpecs.length === 0)) {
      await this.gridTest.waitForCells()
    }

    if (rowSpecs) {
      await this.hasRows(rowSpecs)
    }
  }

  async hasRows(rowSpecs)
  {
    const rowCount = await this.gridTest.getRowCount()
    expect(rowCount).toBe(rowSpecs.length)
    for (let i = 0; i < rowSpecs.length; i++) {
      await this.hasRow(i, rowSpecs[i])
    }
  }

  async hasRow(i, rowSpec) {
    const rowContents = await this.gridTest.getRowContents(i)
    expect(rowContents.length).toBe(rowSpec.length)
    expect(rowContents[0]).toMatch(rowSpec[0])
    for (let j = 1; j < rowContents.length; j++) {
      expect(rowContents[j]).toBe(rowSpec[j])
    }
  }
}
