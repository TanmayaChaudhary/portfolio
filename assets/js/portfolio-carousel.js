/**
 * portfolio-carousel.js — Filter Tabs + Paginated Grid
 *
 * Shows portfolio cards in a fixed 3×2 grid (6 per page).
 * Filter tabs narrow the pool; arrows paginate within the filtered set.
 * Runs after DOM is ready. No external dependencies beyond jQuery (for feather).
 */
(function () {
  'use strict';

  var CARDS_PER_PAGE = 6; // 3 columns × 2 rows
  var currentPage = 0;
  var currentFilter = 'all';
  var allCards = [];
  var filteredCards = [];
  var isFirstRender = true;

  function init() {
    var grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    // Collect all card elements
    allCards = Array.prototype.slice.call(grid.querySelectorAll('.portfolio-card'));

    // Build filter tabs from unique categories
    buildFilterTabs();

    // Set initial filter
    applyFilter('all');

    // Bind arrow clicks
    var prevBtn = document.querySelector('.portfolio-nav-prev');
    var nextBtn = document.querySelector('.portfolio-nav-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { goToPage(currentPage - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goToPage(currentPage + 1); });
  }

  function buildFilterTabs() {
    var tabsContainer = document.querySelector('.portfolio-filter-tabs');
    if (!tabsContainer) return;

    // Get unique categories
    var categories = [];
    allCards.forEach(function (card) {
      var cat = card.getAttribute('data-portfolio-category');
      if (cat && categories.indexOf(cat) === -1) {
        categories.push(cat);
      }
    });

    // Clear existing tabs (keep the "All" button)
    tabsContainer.innerHTML = '';

    // Add "All" tab
    var allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.setAttribute('data-filter', 'all');
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', function () { onFilterClick('all', allBtn); });
    tabsContainer.appendChild(allBtn);

    // Add category tabs
    categories.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.setAttribute('data-filter', cat);
      btn.textContent = cat;
      btn.addEventListener('click', function () { onFilterClick(cat, btn); });
      tabsContainer.appendChild(btn);
    });
  }

  function onFilterClick(filter, btn) {
    // Update active state
    var tabs = document.querySelectorAll('.portfolio-filter-tabs .filter-btn');
    tabs.forEach(function (t) { t.classList.remove('active'); });
    btn.classList.add('active');

    currentFilter = filter;
    currentPage = 0;
    applyFilter(filter);
  }

  function applyFilter(filter) {
    // Determine which cards match the filter
    if (filter === 'all') {
      filteredCards = allCards.slice();
    } else {
      filteredCards = allCards.filter(function (card) {
        return card.getAttribute('data-portfolio-category') === filter;
      });
    }

    renderPage();
    renderDots();
    updateArrows();
  }

  function renderPage() {
    var start = currentPage * CARDS_PER_PAGE;
    var end = start + CARDS_PER_PAGE;
    var visibleSet = filteredCards.slice(start, end);
    var grid = document.getElementById('portfolio-grid');

    // First render: instant, no animation
    if (isFirstRender) {
      isFirstRender = false;
      allCards.forEach(function (card) { card.classList.add('hidden'); });
      visibleSet.forEach(function (card) { card.classList.remove('hidden'); });
      return;
    }

    // Subsequent renders: smooth fade + slide
    if (grid) grid.classList.add('transitioning');

    setTimeout(function () {
      allCards.forEach(function (card) { card.classList.add('hidden'); });
      visibleSet.forEach(function (card) { card.classList.remove('hidden'); });
      if (grid) {
        // Reset transform direction then fade in
        grid.classList.remove('transitioning');
      }
    }, 250);
  }

  function getTotalPages() {
    return Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE));
  }

  function renderDots() {
    var dotsContainer = document.getElementById('portfolio-dots');
    if (!dotsContainer) return;

    var totalPages = getTotalPages();
    dotsContainer.innerHTML = '';

    // Don't show dots if only 1 page
    if (totalPages <= 1) return;

    for (var i = 0; i < totalPages; i++) {
      var dot = document.createElement('span');
      dot.className = 'dot' + (i === currentPage ? ' active' : '');
      dot.setAttribute('data-page', i);
      (function (pageIndex) {
        dot.addEventListener('click', function () { goToPage(pageIndex); });
      })(i);
      dotsContainer.appendChild(dot);
    }
  }

  function updateArrows() {
    var totalPages = getTotalPages();
    var prevBtn = document.querySelector('.portfolio-nav-prev');
    var nextBtn = document.querySelector('.portfolio-nav-next');

    if (prevBtn) prevBtn.disabled = (currentPage <= 0);
    if (nextBtn) nextBtn.disabled = (currentPage >= totalPages - 1);

    // Hide arrows entirely if only 1 page
    if (totalPages <= 1) {
      if (prevBtn) prevBtn.style.visibility = 'hidden';
      if (nextBtn) nextBtn.style.visibility = 'hidden';
    } else {
      if (prevBtn) prevBtn.style.visibility = '';
      if (nextBtn) nextBtn.style.visibility = '';
    }
  }

  function goToPage(page) {
    var totalPages = getTotalPages();
    if (page < 0 || page >= totalPages) return;

    currentPage = page;
    renderPage();
    renderDots();
    updateArrows();
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
