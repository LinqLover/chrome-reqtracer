/**
 * Copied from https://github.com/ag-grid/ag-grid-testing/blob/latest/e2e/utils.ts (MIT License).
 */

/** 
 * Wait for the grid to finish rendering and for the cells to be visible
 */
export async function waitForCells(page) {
    await page.locator('.ag-overlay').first().waitFor({ state: 'hidden' });
    await page.locator('.ag-cell').first().waitFor({ state: 'visible' });
}

/**
 * Returns the total number of rows in the grid
 */
export async function getRowCount(page) {
    // We have to subtract the number of header rows from the total aria-rowcount to get the actual row count
    const headers = await page.locator('.ag-header .ag-header-row').and(page.getByRole('row')).all();
    const totalAriaRowCount = await page.getByRole('treegrid').getAttribute('aria-rowcount');
    return Number(totalAriaRowCount) - Number(headers.length);
}

/**
 * Returns a locator for the header cell
 */
export function getHeaderLocator(page, options) {
    if (options.colHeaderName) {
        return page.getByRole('columnheader', { name: options.colHeaderName });
    }
    return page.getByRole('columnheader').and(page.locator(`[col-id="${options.colId}"]`));
}

/**
 * Returns a locator for the cell based off colId and rowIndex
 */
export function getCellLocator(page, colId, rowIndex) {
    const locatorString = `[row-index="${rowIndex}"] [col-id="${colId}"]`;
    return page.locator(locatorString);
}

/**
 * Returns a locator for the row based off rowIndex
 */
export function getRowLocator(page, rowIndex) {
    const locatorString = `[row-index="${rowIndex}"]`;
    return page.locator(locatorString);
}

/**
 * Returns the contents of the row as an array of string values
 */
export async function getRowContents(page, rowIndex) {
    const cells = await getRowLocator(page, rowIndex).getByRole('gridcell').all();

    // Return the cell values in the order they appear to the user not the order they appear in the DOM
    const cellValues = Array(cells.length);
    for (let i = 0; i < cells.length; i++) {
        const colIndex = Number(await cells[i].getAttribute('aria-colindex'));
        // innerText works better for grouping 
        cellValues[colIndex - 1] = await cells[i].innerText();
    }
    return cellValues;
}

/**
 * Returns a locator for the cell based off rowIndex and either colId or colHeaderName
 */
export async function getCellLocatorBy(page, options) {
    let colId = options.colId;
    if (!colId && options.colHeaderName) {
        const headerCell = page.getByRole('columnheader', { name: options.colHeaderName });
        colId = await headerCell.getAttribute('col-id');
    }
    return getCellLocator(page, colId, options.rowIndex);
}

/**
 * Returns a test object with helper methods for interacting with AG Grid for the given page.
 */
export function agGridTest(page){
    return {
        waitForCells: async () => {
            await waitForCells(page);
        },
        getRowCount: async () => {
            return await getRowCount(page);
        },
        getHeaderLocator: (options) => {
            return getHeaderLocator(page, options);
        },
        getCellLocator: (colId, rowIndex) => {
            return getCellLocator(page, colId, rowIndex);
        },
        getRowLocator: (rowIndex) => {
            return getRowLocator(page, rowIndex);
        },
        getRowContents: (rowIndex) => {
            return getRowContents(page, rowIndex);
        },
        getCellLocatorBy: (options) => {
            return getCellLocatorBy(page, options);
        }
    }
}
