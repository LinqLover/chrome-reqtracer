export const defaultSettings = {
  /**
   * If enabled, reloading a page will reset the requests for the current tab.
   */
  resetOnReload: false,
  /**
   * If enabled, requests will be monitored for all tabs continuously. If disabled, requests will not be persisted when switching to a different tab.
   *
   * Enabling this preference may increase memory usage significantly.
   */
  traceBackgroundTabs: true,
}
