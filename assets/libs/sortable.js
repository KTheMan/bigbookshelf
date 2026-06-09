/* Sortable.js stub for webOS TV */
/* Provides basic drag/drop replacement for list reordering via keyboard */
(function () {
  if (typeof window.Sortable !== 'undefined') return

  window.Sortable = {
    create: function (el, options) {
      console.log('[Sortable] Sortable stub initialized for webOS TV', options)
      el._sortableOptions = options
      return {
        destroy: function () {},
        option: function () {}
      }
    }
  }
})()
