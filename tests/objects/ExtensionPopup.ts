import { expect, Page } from '@playwright/test'
import { agGridTest } from '../vendor/agGridUtils.ts'

export type RowSpec = [RegExp, string, string]

export default class ExtensionPopup {
  gridTest: ReturnType<typeof agGridTest>
  constructor(public page: Page) {
    this.gridTest = agGridTest(this.page)
  }

  async clearRequests() {
    await this.page.click('#clear-requests-button')
  }

  async waitForRows(rowSpecs: RowSpec[] | undefined = undefined) {
    if (!(rowSpecs !== undefined && rowSpecs.length === 0)) {
      await this.gridTest.waitForCells()
    }

    if (rowSpecs) {
      await this.hasRows(rowSpecs)
    }
  }

  async hasRows(rowSpecs: RowSpec[])
  {
    const rowCount = await this.gridTest.getRowCount()
    expect(rowCount).toBe(rowSpecs.length)
    for (let i = 0; i < rowSpecs.length; i++) {
      await this.hasRow(i, rowSpecs[i])
    }
  }

  async hasRow(index: number, rowSpec: RowSpec) {
    const rowContents = await this.gridTest.getRowContents(index)
    expect(rowContents.length).toBe(rowSpec.length)
    expect(rowContents[0]).toMatch(rowSpec[0])
    for (let colIndex = 1; colIndex < rowContents.length; colIndex++) {
      expect(rowContents[colIndex]).toBe(rowSpec[colIndex])
    }
  }
}
