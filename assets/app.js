/* ==========================================================================
   SISB ICT — hub filtering
   Loads activities.json, builds filter chips from the data, renders cards.
   Adding a new activity = one entry in activities.json. No HTML editing.
   ========================================================================== */

(function () {
  'use strict';

  var DATA_URL = 'assets/data/activities.json';

  /* Which emoji + label represents each activity type. */
  var TYPE_META = {
    game:      { icon: '🎮', label: 'Game' },
    activity:  { icon: '🧩', label: 'Activity' },
    website:   { icon: '🌐', label: 'Website' },
    video:     { icon: '📹', label: 'Video' },
    worksheet: { icon: '📝', label: 'Worksheet' },
    slides:    { icon: '🎞️', label: 'Slides' },
    other:     { icon: '📦', label: 'Other' }
  };

  /* Year levels always shown in this order, regardless of data order. */
  var YEAR_ORDER = ['lower primary', 'upper primary'];

  /* Filter state. Within a group the match is OR; across groups it is AND. */
  var state = { year: [], topic: [], type: [] };

  var allActivities = [];
  var els = {};

  /* ---------------------------------------------------------------- utils */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function uniq(arr) {
    return arr.filter(function (v, i) { return arr.indexOf(v) === i; });
  }

  /* --------------------------------------------------------------- render */

  function renderChips() {
    var years = uniq(allActivities.reduce(function (a, x) { return a.concat(x.year_levels || []); }, []));
    years.sort(function (a, b) {
      var ia = YEAR_ORDER.indexOf(a), ib = YEAR_ORDER.indexOf(b);
      if (ia === -1) ia = 99;
      if (ib === -1) ib = 99;
      return ia - ib || String(a).localeCompare(String(b));
    });

    var topics = uniq(allActivities.map(function (x) { return x.topic; }).filter(Boolean)).sort();
    var types = uniq(allActivities.map(function (x) { return x.type; }).filter(Boolean));

    function chipsFor(group, values, labeller) {
      return values.map(function (v) {
        return '<button class="filter-chip" type="button" data-group="' + group +
               '" data-value="' + escapeHtml(v) + '" aria-pressed="false">' +
               escapeHtml(labeller ? labeller(v) : v) + '</button>';
      }).join('');
    }

    els.groups.innerHTML =
      '<div class="filter-group">' +
        '<span class="filter-label">Year</span>' +
        chipsFor('year', years) +
      '</div>' +
      '<div class="filter-group">' +
        '<span class="filter-label">Topic</span>' +
        chipsFor('topic', topics) +
      '</div>' +
      '<div class="filter-group">' +
        '<span class="filter-label">Type</span>' +
        chipsFor('type', types, function (t) {
          var m = TYPE_META[t] || TYPE_META.other;
          return m.icon + ' ' + m.label;
        }) +
      '</div>';
  }

  function matches(a) {
    function groupOk(group, values) {
      if (!values.length) return true;
      if (group === 'year') {
        return (a.year_levels || []).some(function (y) { return values.indexOf(y) !== -1; });
      }
      return values.indexOf(a[group]) !== -1;
    }
    return groupOk('year', state.year) &&
           groupOk('topic', state.topic) &&
           groupOk('type', state.type);
  }

  function cardHtml(a) {
    var meta = TYPE_META[a.type] || TYPE_META.other;
    var target = a.external ? ' target="_blank" rel="noopener"' : '';

    var tags = []
      .concat((a.year_levels || []).map(function (y) { return { k: 'year', v: y }; }))
      .concat(a.topic ? [{ k: 'topic', v: a.topic }] : [])
      .concat((a.tags || []).slice(0, 3).map(function (t) { return { k: 'tag', v: t }; }))
      .map(function (t) {
        return '<span class="tag" data-kind="' + t.k + '">' + escapeHtml(t.v) + '</span>';
      }).join('');

    return '<a class="card" href="' + escapeHtml(a.path) + '"' + target + '>' +
             '<div class="card-head">' +
               '<span class="type-badge" data-type="' + escapeHtml(a.type) + '">' +
                 meta.icon + ' ' + escapeHtml(meta.label) +
               '</span>' +
             '</div>' +
             '<div class="card-title">' + escapeHtml(a.title) + '</div>' +
             '<div class="card-desc">' + escapeHtml(a.description || '') + '</div>' +
             '<div class="tag-row">' + tags + '</div>' +
           '</a>';
  }

  function activeCount() {
    return state.year.length + state.topic.length + state.type.length;
  }

  function render() {
    var visible = allActivities.filter(matches);

    els.grid.innerHTML = visible.length
      ? visible.map(cardHtml).join('')
      : '<div class="empty-state">' +
          '<span class="empty-emoji">🔍</span>' +
          '<p>No activities match those filters.<br>Try removing one.</p>' +
        '</div>';

    els.count.innerHTML = 'Showing <strong>' + visible.length + '</strong> of ' +
                          '<strong>' + allActivities.length + '</strong> ' +
                          (allActivities.length === 1 ? 'activity' : 'activities');

    // Reflect filter state back onto the chips.
    Array.prototype.forEach.call(els.groups.querySelectorAll('.filter-chip'), function (chip) {
      var group = chip.getAttribute('data-group');
      var value = chip.getAttribute('data-value');
      chip.setAttribute('aria-pressed', state[group].indexOf(value) !== -1 ? 'true' : 'false');
    });

    var n = activeCount();
    els.clear.hidden = n === 0;
    els.toggleCount.hidden = n === 0;
    els.toggleCount.textContent = String(n);

    syncHash();
  }

  /* Keep filtered views shareable: #year=P4&topic=Networks */
  function syncHash() {
    var parts = [];
    ['year', 'topic', 'type'].forEach(function (g) {
      state[g].forEach(function (v) {
        parts.push(g + '=' + encodeURIComponent(v));
      });
    });
    var hash = parts.length ? '#' + parts.join('&') : '';
    if (window.location.hash !== hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search + hash);
    }
  }

  function readHash() {
    var raw = window.location.hash.replace(/^#/, '');
    if (!raw) return;
    raw.split('&').forEach(function (pair) {
      var bits = pair.split('=');
      var group = bits[0];
      var value = decodeURIComponent(bits[1] || '');
      if (state[group] && value && state[group].indexOf(value) === -1) {
        state[group].push(value);
      }
    });
  }

  /* --------------------------------------------------------------- events */

  function onChipClick(e) {
    var chip = e.target.closest('.filter-chip');
    if (!chip) return;

    var group = chip.getAttribute('data-group');
    var value = chip.getAttribute('data-value');
    var i = state[group].indexOf(value);

    if (i === -1) state[group].push(value);
    else state[group].splice(i, 1);

    render();
  }

  function onClear() {
    state = { year: [], topic: [], type: [] };
    render();
  }

  function onToggle() {
    var open = els.bar.classList.toggle('open');
    els.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* ----------------------------------------------------------------- init */

  function showError(message, detail) {
    els.grid.innerHTML =
      '<div class="empty-state">' +
        '<span class="empty-emoji">⚠️</span>' +
        '<p><strong>' + escapeHtml(message) + '</strong></p>' +
        (detail ? '<p style="margin-top:8px;font-size:0.85rem;">' + escapeHtml(detail) + '</p>' : '') +
      '</div>';
    els.count.textContent = '';
  }

  function init(data) {
    allActivities = Array.isArray(data) ? data : [];
    readHash();
    renderChips();
    render();

    els.groups.addEventListener('click', onChipClick);
    els.clear.addEventListener('click', onClear);
    els.toggle.addEventListener('click', onToggle);
    window.addEventListener('hashchange', function () {
      state = { year: [], topic: [], type: [] };
      readHash();
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    els.bar = document.getElementById('filterBar');
    els.groups = document.getElementById('filterGroups');
    els.clear = document.getElementById('filterClear');
    els.toggle = document.getElementById('filterToggle');
    els.toggleCount = document.getElementById('filterToggleCount');
    els.grid = document.getElementById('cardGrid');
    els.count = document.getElementById('resultCount');

    fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(init)
      .catch(function (err) {
        // Opening index.html straight from disk blocks fetch (CORS).
        // Over GitHub Pages — or any local web server — this works.
        var isFile = window.location.protocol === 'file:';
        showError(
          isFile
            ? 'This page needs to be served over HTTP.'
            : 'Could not load the activity list.',
          isFile
            ? 'Opening the file directly blocks the data load. Run "python3 -m http.server" in this folder, then visit localhost:8000 — or just use the GitHub Pages URL.'
            : String(err.message || err)
        );
      });
  });
})();