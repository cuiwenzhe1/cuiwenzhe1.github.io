/**
 * 侧栏「日历」：左侧今天 + 右侧月历
 * ══════════════════════════════════════════════════════════════
 * 挂在公告卡里（容器 #ink-heatmap）。布局按 fomal 的 aside-calendar：
 *
 *     第46周 周六        日 一 二 三 四 五 六
 *          14            ...
 *     2026年11月 第318天
 *     丙午马年 十月初六
 *     ── 10天后是 小雪 ──
 *
 *   · 左侧：第几周/星期、日期、年内第几天、农历
 *   · 右侧：当月网格（不翻月），深色圆底 = 今天，红字 = 节日，绿圈 = 当天发了文章
 *   · 底部：下一个节气，版式对照 fomal 的 .cal-extra
 *   · 悬停任意格子 → 日期 / 节日 / 文章标题；点有文章的格子跳过去
 *
 * 数据来自构建期生成的 /data/heatmap.json（见 scripts/heatmap-data.js），
 * 浏览器端不请求任何外部接口。农历只在构建期算好今天的值写进 JSON，
 * 不引入 fomal 那份 1000 多行的浏览器版 lunar.js；运行日期和构建日期不一致时
 * 前端会隐藏农历行，避免显示旧数据。
 *
 * 依赖：无。pjax 兼容：监听 pjax:complete 重新挂载。
 */

(function () {
  'use strict'

  var DATA_URL = '/data/heatmap.json'
  var WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']
  var WEEK_START = 0          // 0 = 周日开头（跟 fomalhaut 的月历一致）

  // 重要节日加粗；格子里不再写节日名，名字放在悬停浮层里。
  var BIG_FESTIVALS = [
    '元旦', '春节', '元宵节', '清明节', '清明', '劳动节', '端午节',
    '中秋节', '国庆节', '重阳节', '腊八节', '冬至', '七夕', '中元节', '龙抬头'
  ]

  var payload = null
  var tip = null

  /* ── 工具 ───────────────────────────────────────────── */

  function pad2 (n) { return (n < 10 ? '0' : '') + n }
  function fmt (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) }

  function startOfDay (d) {
    var x = new Date(d.getTime())
    x.setHours(0, 0, 0, 0)
    return x
  }

  // 运行期的今天，不用构建日，避免页面挂着跨天后还显示旧日期
  function today () { return startOfDay(new Date()) }

  // ISO-8601 周号：含当年第一个周四的那一周算第 1 周
  function isoWeek (d) {
    var t = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    t.setDate(t.getDate() - ((t.getDay() + 6) % 7) + 3)
    var isoYear = t.getFullYear()
    var jan4 = new Date(isoYear, 0, 4)
    var week1Thu = new Date(isoYear, 0, 4 - ((jan4.getDay() + 6) % 7) + 3)
    return 1 + Math.round((t - week1Thu) / 604800000)
  }

  function dayOfYear (d) {
    var start = new Date(d.getFullYear(), 0, 1)
    return Math.round((startOfDay(d) - start) / 86400000) + 1
  }

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
    var t = today()
    var y = t.getFullYear()
    var m = t.getMonth()
    var first = new Date(y, m, 1)
    var dim = new Date(y, m + 1, 0).getDate()          // 当月天数
    var lead = (first.getDay() - WEEK_START + 7) % 7   // 1 号前面空几格

    // 农历只在构建日和运行日一致时显示；不引入浏览器版农历库
    var lunar = payload.lunar && payload.lunar.date === fmt(t) ? payload.lunar : null
    var lunarHtml = lunar
      ? '<div class="hm-lunar">' + escapeHtml(lunar.gzYear + lunar.animal + '年 ' + lunar.month + lunar.day) + '</div>'
      : ''

    // 底部一行：下一个节气，版式对照 fomal 的 .cal-extra
    var term = payload.nextTerm
    var extraHtml = term
      ? '<div class="hm-extra"><span class="hm-extra-term">' +
        (term.days === 0 ? '今天就是' : term.days + '天后是') +
        '<em>' + escapeHtml(term.name) + '</em></span></div>'
      : ''

    var html = '<div class="hm-main">' +
      '<div class="hm-today">' +
        '<div class="hm-week">第' + isoWeek(t) + '周 周' + WEEK_CN[t.getDay()] + '</div>' +
        '<div class="hm-daynum">' + pad2(t.getDate()) + '</div>' +
        '<div class="hm-solar">' + y + '年' + (m + 1) + '月 第' + dayOfYear(t) + '天</div>' +
        lunarHtml +
      '</div>' +
      '<div class="hm-grid">'

    // 表头 + 日期格
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
      if (key === fmt(t)) cls += ' is-today'
      if (info.f) cls += ' is-fes'
      if (big) cls += ' is-fes-big'
      // is-post 只加个类，绿圈由 CSS 套在数字外面（.hm-cell.is-post .hm-day）
      if (info.n) cls += ' is-post'
      var clickable = info.u ? ' role="button" tabindex="0"' : ''

      html += '<span class="' + cls + '" data-date="' + key + '"' + clickable + '>' +
        '<b class="hm-day">' + d + '</b></span>'
    }

    html += '</div></div>' + extraHtml
    root.innerHTML = html

    // 格子交互
    var cells = root.querySelectorAll('.hm-cell[data-date]')
    for (var c = 0; c < cells.length; c++) {
      bindCell(cells[c], root)
    }
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
