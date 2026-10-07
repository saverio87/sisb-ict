/* ========================================================================== 
   SISB ICT — Digital Lab activity catalogue
   Loads activities.json and keeps search and filters reflected in the URL.
   ========================================================================== */

(function () {
  'use strict';

  var DATA_URL = 'assets/data/activities.json';

  var TYPE_META = {
    game:      { label: 'Game' },
    activity:  { label: 'Activity' },
    website:   { label: 'Website' },
    video:     { label: 'Video' },
    tool:      { label: 'Tool' },
    worksheet: { label: 'Worksheet' },
    slides:    { label: 'Slides' },
    other:     { label: 'Other' }
  };

  var TOPIC_META = {
    'Networks':     { code: 'NET', tone: '#52e8d1' },
    'Data':         { code: 'DAT', tone: '#ffcf5a' },
    'Functions':    { code: 'FUN', tone: '#c6ff43' },
    'UI/UX':        { code: 'UX',  tone: '#e497ff' },
    'Mixed Review': { code: 'REV', tone: '#8da0ff' },
    'Teacher Tools': { code: 'TCH', tone: '#ff8a54' }
  };

  var VIZ_LABELS = {
    'build-a-lan-week4': 'LAN',
    'packet-panic-week4': 'PKT',
    'packet-post-week4': 'IP',
    'recipe-remix': 'FN',
    'pick-the-right-slot': '[ ]',
    'the-counting-race': '123',
    'ui-ux-good-vs-bad': 'UI',
    'wordwall-activities': '09',
    'teacher-context-toolkit': 'TCT',
    'teacher-prompt-collection': 'PRM'
  };

  var YEAR_ORDER = ['lower primary', 'upper primary'];
  var FALLBACK_TONES = ['#52e8d1', '#c6ff43', '#ff8a54', '#8da0ff', '#e497ff'];
  var state = { year: [], topic: [], type: [], search: '' };
  var allActivities = [];
  var els = {};

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function uniq(values) {
    return values.filter(function (value, index) { return values.indexOf(value) === index; });
  }

  function topicMeta(topic, index) {
    if (TOPIC_META[topic]) return TOPIC_META[topic];
    return {
      code: String(topic || 'OTH').replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'OTH',
      tone: FALLBACK_TONES[index % FALLBACK_TONES.length]
    };
  }

  function typeLabel(type) {
    return (TYPE_META[type] || TYPE_META.other).label;
  }

  function renderTopicNav() {
    var topics = uniq(allActivities.map(function (activity) { return activity.topic; }).filter(Boolean)).sort();
    var items = [{ value: '', label: 'All activities', code: 'ALL', count: allActivities.length }]
      .concat(topics.map(function (topic, index) {
        return {
          value: topic,
          label: topic,
          code: topicMeta(topic, index).code,
          count: allActivities.filter(function (activity) { return activity.topic === topic; }).length
        };
      }));

    els.topicNav.innerHTML = items.map(function (item) {
      return '<button class="topic-button" type="button" data-topic="' + escapeHtml(item.value) +
             '" data-short="' + escapeHtml(item.code) + '" aria-pressed="false">' +
               '<span class="topic-label">' + escapeHtml(item.label) + '</span>' +
               '<span class="topic-count">' + String(item.count).padStart(2, '0') + '</span>' +
             '</button>';
    }).join('');

    els.statCount.textContent = String(allActivities.length).padStart(2, '0');
    els.topicCount.textContent = String(topics.length).padStart(2, '0');
  }

  function renderRefineFilters() {
    var years = uniq(allActivities.reduce(function (values, activity) {
      return values.concat(activity.year_levels || []);
    }, []));
    years.sort(function (a, b) {
      var aIndex = YEAR_ORDER.indexOf(a);
      var bIndex = YEAR_ORDER.indexOf(b);
      if (aIndex === -1) aIndex = 99;
      if (bIndex === -1) bIndex = 99;
      return aIndex - bIndex || String(a).localeCompare(String(b));
    });

    var types = uniq(allActivities.map(function (activity) { return activity.type; }).filter(Boolean)).sort();

    function chipsFor(group, values, labeller) {
      return values.map(function (value) {
        return '<button class="filter-chip" type="button" data-group="' + group +
               '" data-value="' + escapeHtml(value) + '" aria-pressed="false">' +
               escapeHtml(labeller ? labeller(value) : value) + '</button>';
      }).join('');
    }

    els.filterGroups.innerHTML =
      '<div class="filter-group"><span class="filter-label">Year</span>' +
        chipsFor('year', years) +
      '</div>' +
      '<div class="filter-group"><span class="filter-label">Format</span>' +
        chipsFor('type', types, typeLabel) +
      '</div>';
  }

  function matches(activity) {
    function groupMatches(group, selected) {
      if (!selected.length) return true;
      if (group === 'year') {
        return (activity.year_levels || []).some(function (year) { return selected.indexOf(year) !== -1; });
      }
      return selected.indexOf(activity[group]) !== -1;
    }

    var searchText = [
      activity.title,
      activity.description,
      activity.topic,
      activity.type
    ].concat(activity.year_levels || [], activity.tags || []).join(' ').toLowerCase();

    return groupMatches('year', state.year) &&
           groupMatches('topic', state.topic) &&
           groupMatches('type', state.type) &&
           (!state.search || searchText.indexOf(state.search.toLowerCase()) !== -1);
  }

  function cardHtml(activity, index) {
    var meta = topicMeta(activity.topic, index);
    var target = activity.external ? ' target="_blank" rel="noopener"' : '';
    var viz = VIZ_LABELS[activity.id] || meta.code;
    var number = String(index + 1).padStart(2, '0');
    var levels = activity.year_levels || [];
    var year = levels.length > 1 ? 'All primary' : (levels[0] || 'Primary');
    var firstTag = (activity.tags || [])[0] || activity.topic || 'ICT';

    return '<a class="mission-card" href="' + escapeHtml(activity.path) + '"' + target +
           ' style="--tone:' + meta.tone + '">' +
             '<div class="mission-copy">' +
               '<span class="mission-meta">' + escapeHtml(meta.code) + '.' + number +
                 ' / ' + escapeHtml(typeLabel(activity.type)) + '</span>' +
               '<h3>' + escapeHtml(activity.title) + '</h3>' +
               '<p>' + escapeHtml(activity.description || '') + '</p>' +
               '<div class="mission-tags"><span>' + escapeHtml(year) + '</span><span>' + escapeHtml(firstTag) + '</span></div>' +
               '<div class="launch-label">Launch module <span>↗</span></div>' +
             '</div>' +
             '<div class="mission-viz" aria-hidden="true"><b>' + escapeHtml(viz) + '</b></div>' +
           '</a>';
  }

  function activeCount() {
    return state.year.length + state.topic.length + state.type.length;
  }

  function render() {
    var visible = allActivities.filter(matches);

    els.grid.innerHTML = visible.length
      ? visible.map(function (activity) { return cardHtml(activity, allActivities.indexOf(activity)); }).join('')
      : '<div class="empty-state"><span class="empty-code">NO / MATCH</span>' +
          '<p>No modules match this search. Try another topic or clear a filter.</p></div>';

    els.resultCount.textContent = String(visible.length).padStart(2, '0') +
      ' of ' + String(allActivities.length).padStart(2, '0') + ' modules loaded';

    Array.prototype.forEach.call(els.filterGroups.querySelectorAll('.filter-chip'), function (chip) {
      var group = chip.getAttribute('data-group');
      var value = chip.getAttribute('data-value');
      chip.setAttribute('aria-pressed', state[group].indexOf(value) !== -1 ? 'true' : 'false');
    });

    Array.prototype.forEach.call(els.topicNav.querySelectorAll('.topic-button'), function (button) {
      var value = button.getAttribute('data-topic');
      var pressed = value ? state.topic.indexOf(value) !== -1 : state.topic.length === 0;
      button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    });

    var filtersActive = activeCount();
    els.clear.hidden = filtersActive === 0 && !state.search;
    els.toggleCount.hidden = filtersActive === 0;
    els.toggleCount.textContent = String(filtersActive);
    if (els.search.value !== state.search) els.search.value = state.search;

    syncHash();
  }

  function syncHash() {
    var parts = [];
    ['year', 'topic', 'type'].forEach(function (group) {
      state[group].forEach(function (value) {
        parts.push(group + '=' + encodeURIComponent(value));
      });
    });
    if (state.search) parts.push('q=' + encodeURIComponent(state.search));

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
      var value = decodeURIComponent(bits.slice(1).join('=') || '');
      if (group === 'q') state.search = value;
      if (state[group] && Array.isArray(state[group]) && value && state[group].indexOf(value) === -1) {
        state[group].push(value);
      }
    });
  }

  function onTopicClick(event) {
    var button = event.target.closest('.topic-button');
    if (!button) return;

    var value = button.getAttribute('data-topic');
    if (!value) {
      state.topic = [];
    } else {
      var index = state.topic.indexOf(value);
      if (index === -1) state.topic.push(value);
      else state.topic.splice(index, 1);
    }
    render();
  }

  function onFilterClick(event) {
    var chip = event.target.closest('.filter-chip');
    if (!chip) return;

    var group = chip.getAttribute('data-group');
    var value = chip.getAttribute('data-value');
    var index = state[group].indexOf(value);
    if (index === -1) state[group].push(value);
    else state[group].splice(index, 1);
    render();
  }

  function clearFilters() {
    state = { year: [], topic: [], type: [], search: '' };
    render();
  }

  function toggleFilters() {
    var open = els.filterBar.classList.toggle('open');
    els.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function showError(message, detail) {
    els.grid.innerHTML = '<div class="empty-state"><span class="empty-code">SYS / ERROR</span>' +
      '<p><strong>' + escapeHtml(message) + '</strong></p>' +
      (detail ? '<p class="error-detail">' + escapeHtml(detail) + '</p>' : '') + '</div>';
    els.resultCount.textContent = 'Catalogue unavailable';
  }

  function init(data) {
    allActivities = Array.isArray(data) ? data : [];
    readHash();
    renderTopicNav();
    renderRefineFilters();

    if (allActivities[0]) {
      els.featured.href = allActivities[0].path;
      els.featuredTitle.textContent = allActivities[0].title;
    }

    els.topicNav.addEventListener('click', onTopicClick);
    els.filterGroups.addEventListener('click', onFilterClick);
    els.clear.addEventListener('click', clearFilters);
    els.toggle.addEventListener('click', toggleFilters);
    els.search.addEventListener('input', function () {
      state.search = els.search.value.trim();
      render();
    });
    window.addEventListener('hashchange', function () {
      state = { year: [], topic: [], type: [], search: '' };
      readHash();
      render();
    });

    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    els.topicNav = document.getElementById('topicNav');
    els.filterBar = document.getElementById('filterBar');
    els.filterGroups = document.getElementById('filterGroups');
    els.clear = document.getElementById('filterClear');
    els.toggle = document.getElementById('filterToggle');
    els.toggleCount = document.getElementById('filterToggleCount');
    els.grid = document.getElementById('cardGrid');
    els.resultCount = document.getElementById('resultCount');
    els.search = document.getElementById('searchInput');
    els.statCount = document.getElementById('statCount');
    els.topicCount = document.getElementById('topicCount');
    els.featured = document.getElementById('featuredCard');
    els.featuredTitle = document.getElementById('featuredTitle');

    fetch(DATA_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(init)
      .catch(function (error) {
        var isFile = window.location.protocol === 'file:';
        showError(
          isFile ? 'This page needs to be served over HTTP.' : 'Could not load the activity catalogue.',
          isFile
            ? 'Run a local web server in this folder, then open the localhost address.'
            : String(error.message || error)
        );
      });
  });
})();
