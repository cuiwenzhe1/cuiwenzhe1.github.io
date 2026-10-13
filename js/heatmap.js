/**
 * calendar.js 的姊妹文件 —— 侧栏「墨历」发文月历
 * ══════════════════════════════════════════════════════════════
 * 挂在公告卡里（容器 #ink-heatmap），显示当月日历，左右箭头翻月：
 *
 *     ‹   2026年10月   ›
 *     日 一 二 三 四 五 六
 *                       1  2  3
 *      4  5  6  7  8  9 10
 *     …
 *
 *   · 红色字 = 节日（直接把名字写在格子里，节气和小节日只标红不写字）
 *   · 深色圆底 = 今天
 *   · 名字下面的小墨点 = 当天发了文章
 *   · 悬停任意格子 → 日期 / 节日 / 文章标题；点有文章的格子跳过去
 *
 * 数据来自构建期生成的 /data/heatmap.json（见 scripts/heatmap-data.js），
 * 浏览器端不请求任何外部接口。农历换算在构建期做完了，这边不用管。
 *
 * 依赖：无。pjax 兼容：监听 pjax:complete 重新挂载。
 */

(function () {
  'use strict'

  var DATA_URL = '/data/heatmap.json'
  var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']
  var WEEK_START = 0          // 0 = 周日开头（跟 fomalhaut 的月历一致）

  // 节日分「重要」和「一般」：重要的把名字写进格子里，一般的只把数字标红
  // （格子里字多了会糊成一片，尤其手机上）。加新节日时照着归类。
  var BIG_FESTIVALS = [
    '元旦', '春节', '元宵节', '清明节', '清明', '劳动节', '端午节',
    '中秋节', '国庆节', '重阳节', '腊八节', '冬至', '七夕', '中元节', '龙抬头'
  ]

  var payload = null
  var view = null             // 当前显示的 { y, m }（m 是 0-11）
  var tip = null

  /* ── 工具 ───────────────────────────────────────────── */

  function pad2 (n) { return (n < 10 ? '0' : '') + n }
  function fmt (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) }
  function parseDay (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]) }

  function today () { return parseDay(payload.today) }

  function escapeHtml (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    })
  }

  function isBig (festivalStr) {
    if (!festivalStr) return ''
    var parts = festivalStr.split(' / ')
    for (var i = 0; i < parts.length; i++) {
      if (BIG_FESTIVALS.indexOf(parts[i]) >= 0) return parts[i]
    }
    return ''
  }

  /* ── tooltip ─────────────────────────────────────────── */

  function ensureTip () {
    if (tip && document.body.contains(tip)) return tip
    tip = document.createElement('div')
    tip.className = 'hm-tip'
    tip.setAttribute('role', 'tooltip')
    document.body.appendChild(tip)
    return tip
  }

  function showTip (info, cx, cy) {
    var t = ensureTip()
    var html = '<b>' + info.date + '</b>'
    if (info.f) html += '<span class="hm-tip-fes">' + escapeHtml(info.f) + '</span>'
    if (info.n) {
      html += '<i>' + info.n + ' 篇' + (info.s ? '（含 ' + info.s + ' 条说说）' : '') + '</i>'
      for (var i = 0; i < info.t.length; i++) html += '<em>' + escapeHtml(info.t[i]) + '</em>'
    }
    t.innerHTML = html
    t.classList.add('hm-tip-on')

    var r = t.getBoundingClientRect()
    var left = cx - r.width / 2
    var top = cy - r.height - 12
    left = Math.max(6, Math.min(left, window.innerWidth - r.width - 6))
    if (top < 6) top = cy + 16
    t.style.left = left + 'px'
    t.style.top = top + 'px'
  }

  function hideTip () { if (tip) tip.classList.remove('hm-tip-on') }

  /* ── 渲染 ────────────────────────────────────────────── */

  function infoOf (dateStr) {
    var rec = payload.days[dateStr]
    return {
      date: dateStr,
      n: rec && rec.n ? rec.n : 0,
      s: rec && rec.s ? rec.s : 0,
      t: rec && rec.t ? rec.t : [],
      f: rec && rec.f ? rec.f : '',
      u: rec && rec.u ? rec.u : ''
    }
  }

  function render (root) {
    var y = view.y
    var m = view.m
    var t = today()
    var first = new Date(y, m, 1)
    var dim = new Date(y, m + 1, 0).getDate()          // 当月天数
    var lead = (first.getDay() - WEEK_START + 7) % 7   // 1 号前面空几格

    var html = ''

    // 头部：翻月
    var prevDis = canPrev() ? '' : ' disabled'
    var nextDis = canNext() ? '' : ' disabled'
    html += '<div class="hm-head">' +
      '<button type="button" class="hm-nav" data-step="-1" aria-label="上个月"' + prevDis + '>‹</button>' +
      '<span class="hm-title">' + y + '年' + (m + 1) + '月</span>' +
      '<button type="button" class="hm-nav" data-step="1" aria-label="下个月"' + nextDis + '>›</button>' +
      '</div>'

    // 表头 + 日期格
    html += '<div class="hm-grid">'
    for (var w = 0; w < 7; w++) {
      html += '<span class="hm-hd">' + WEEK_CN[(WEEK_START + w) % 7] + '</span>'
    }
    for (var e = 0; e < lead; e++) html += '<span class="hm-cell is-empty"></span>'

    for (var d = 1; d <= dim; d++) {
      var date = new Date(y, m, d)
      var key = fmt(date)
      var info = infoOf(key)
      var big = isBig(info.f)

      var cls = 'hm-cell'
      if (key === payload.today) cls += ' is-today'
      if (info.f) cls += ' is-fes'
      if (big) cls += ' is-fes-big'
      // is-post 只加个类，绿圈由 CSS 套在数字外面（.hm-cell.is-post .hm-day）
      if (info.n) cls += ' is-post'
      var clickable = info.u ? ' role="button" tabindex="0"' : ''
      var label = big ? '<em class="hm-fname">' + escapeHtml(big) + '</em>' : ''

      html += '<span class="' + cls + '" data-date="' + key + '"' + clickable + '>' +
        '<b class="hm-day">' + d + '</b>' + label + '</span>'
    }
    html += '</div>'

    root.innerHTML = html

    // 翻月
    var navs = root.querySelectorAll('.hm-nav')
    for (var i = 0; i < navs.length; i++) {
      navs[i].addEventListener('click', function (e) {
        e.preventDefault()
        var step = +this.getAttribute('data-step')
        stepMonth(step, root)
      })
    }

    // 格子交互
    var cells = root.querySelectorAll('.hm-cell[data-date]')
    for (var c = 0; c < cells.length; c++) {
      bindCell(cells[c], root)
    }
  }

  /** 还能往前翻：不早于数据覆盖的最早日期 */
  function canPrev () {
    var limit = payload.from ? parseDay(payload.from) : null
    if (!limit) return true
    return new Date(view.y, view.m, 1) > new Date(limit.getFullYear(), limit.getMonth(), 1)
  }

  /** 还能往后翻：不超过今天所在月 */
  function canNext () {
    var t = today()
    return new Date(view.y, view.m, 1) < new Date(t.getFullYear(), t.getMonth(), 1)
  }

  function stepMonth (step, root) {
    if (step < 0 && !canPrev()) return
    if (step > 0 && !canNext()) return
    hideTip()
    var d = new Date(view.y, view.m + step, 1)
    view = { y: d.getFullYear(), m: d.getMonth() }
    render(root)
  }

  function bindCell (el, root) {
    var info = infoOf(el.getAttribute('data-date'))

    el.addEventListener('mouseenter', function () {
      hideTip()   // 万一上一个格子的 mouseleave 没送到（快速划过、pjax 换页），先清掉
      // 没节日也没文章的格子不值得弹框
      if (!info.n && !info.f) return
      var r = el.getBoundingClientRect()
      showTip(info, r.left + r.width / 2, r.top)
    })
    el.addEventListener('mouseleave', hideTip)

    if (!info.u) return

    function go () {
      location.href = '/' + String(info.u).replace(/^\/+/, '')
    }
    el.addEventListener('click', go)
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() }
    })
    el.addEventListener('touchstart', function () {
      var r = el.getBoundingClientRect()
      showTip(info, r.left + r.width / 2, r.top)
    }, { passive: true })
  }

  /* ── 入口 ────────────────────────────────────────────── */

  function mount () {
    var box = document.getElementById('ink-heatmap')
    if (!box) return
    if (box.getAttribute('data-hm-ready')) return   // pjax 重复注入时别画两遍

    fetch(DATA_URL, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then(function (data) {
        payload = data
        var t = today()
        view = { y: t.getFullYear(), m: t.getMonth() }
        box.setAttribute('data-hm-ready', '1')
        render(box)
      })
      .catch(function () {
        box.innerHTML = '<div class="hm-fallback">日历暂时不可用</div>'
      })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount)
  } else {
    mount()
  }

  // pjax 换页会把侧栏一起换掉，新容器没有 data-hm-ready，这里重新挂一次
  document.addEventListener('pjax:complete', mount)
})()
