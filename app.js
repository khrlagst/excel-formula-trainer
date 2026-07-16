// excel-formula-trainer/app.js
// Formula evaluation engine + app UI (Learn, Practice, Quiz) with leveling.

/* ============================================================
   FORMULA EVALUATION ENGINE
   Supports: numbers, strings, cell refs (A1), ranges (A1:B3),
   operators + - * / & and comparisons = <> < > <= >=, parentheses,
   and functions: SUM, AVERAGE, MIN, MAX, COUNT, IF, AND, OR,
   ROUND, ABS, INT, CONCAT, CONCATENATE, LEFT, RIGHT, UPPER, LOWER, VLOOKUP,
   HLOOKUP, INDEX, MATCH.
   ============================================================ */

function letterToCol(letters) {
  let n = 0;
  for (const c of letters) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}
function colLetter(c) {
  let s = "", n = c + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
function parseCell(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) throw new Error("#NAME?");
  return { col: letterToCol(m[1]), row: parseInt(m[2], 10) - 1 };
}
function getCell(grid, ref) {
  const v = grid[ref];
  return v === undefined ? "" : v;
}
function rangeData(grid, startRef, endRef) {
  const s = parseCell(startRef), e = parseCell(endRef);
  const c1 = Math.min(s.col, e.col), c2 = Math.max(s.col, e.col);
  const r1 = Math.min(s.row, e.row), r2 = Math.max(s.row, e.row);
  const rows = [];
  for (let r = r1; r <= r2; r++) {
    const row = [];
    for (let c = c1; c <= c2; c++) row.push(getCell(grid, colLetter(c) + (r + 1)));
    rows.push(row);
  }
  return rows;
}

/* ---------- Tokenizer ---------- */
function tokenize(src) {
  const tokens = [];
  let i = 0;
  const isDigit = (c) => c >= "0" && c <= "9";
  const isAlpha = (c) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }
    if (isDigit(c) || (c === "." && isDigit(src[i + 1]))) {
      let j = i, seenDot = false;
      while (j < src.length && (isDigit(src[j]) || (src[j] === "." && !seenDot))) {
        if (src[j] === ".") seenDot = true;
        j++;
      }
      tokens.push({ t: "num", v: parseFloat(src.slice(i, j)) });
      i = j; continue;
    }
    if (c === '"' || c === "'") {
      const q = c; let j = i + 1, s = "";
      while (j < src.length && src[j] !== q) { s += src[j]; j++; }
      if (j >= src.length) throw new Error("Unterminated string");
      tokens.push({ t: "str", v: s });
      i = j + 1; continue;
    }
    if (isAlpha(c)) {
      let j = i;
      while (j < src.length && (isAlpha(src[j]) || isDigit(src[j]))) j++;
      const word = src.slice(i, j);
      const up = word.toUpperCase();
      if (up === "TRUE" || up === "FALSE") {
        tokens.push({ t: "bool", v: up === "TRUE" });
      } else if (/^[A-Za-z]+\d+$/.test(word)) {
        tokens.push({ t: "cell", v: word.toUpperCase() });
      } else {
        tokens.push({ t: "name", v: up });
      }
      i = j; continue;
    }
    const two = src.slice(i, i + 2);
    if (two === "<=" || two === ">=" || two === "<>") {
      tokens.push({ t: "op", v: two }); i += 2; continue;
    }
    if ("+-*/&(),:=<>".includes(c)) {
      tokens.push({ t: "op", v: c }); i++; continue;
    }
    throw new Error("Unexpected character: " + c);
  }
  tokens.push({ t: "eof" });
  return tokens;
}

/* ---------- Parser (recursive descent) ---------- */
class Parser {
  constructor(tokens) { this.tokens = tokens; this.pos = 0; }
  peek() { return this.tokens[this.pos]; }
  next() { return this.tokens[this.pos++]; }
  eat(v) {
    const tk = this.peek();
    if (tk.v !== v) throw new Error("Expected '" + v + "'");
    return this.next();
  }
  parseExpr() { return this.parseCompare(); }
  parseCompare() {
    let left = this.parseConcat();
    while (["=", "<>", "<", ">", "<=", ">="].includes(this.peek().v)) {
      const op = this.next().v;
      const right = this.parseConcat();
      left = { type: "cmp", op, left, right };
    }
    return left;
  }
  parseConcat() {
    let left = this.parseAdd();
    while (this.peek().v === "&") {
      this.next();
      const right = this.parseAdd();
      left = { type: "bin", op: "&", left, right };
    }
    return left;
  }
  parseAdd() {
    let left = this.parseMul();
    while (this.peek().v === "+" || this.peek().v === "-") {
      const op = this.next().v;
      const right = this.parseMul();
      left = { type: "bin", op, left, right };
    }
    return left;
  }
  parseMul() {
    let left = this.parseUnary();
    while (this.peek().v === "*" || this.peek().v === "/") {
      const op = this.next().v;
      const right = this.parseUnary();
      left = { type: "bin", op, left, right };
    }
    return left;
  }
  parseUnary() {
    if (this.peek().v === "-" || this.peek().v === "+") {
      const op = this.next().v;
      const operand = this.parseUnary();
      return { type: "unary", op, operand };
    }
    return this.parsePrimary();
  }
  parsePrimary() {
    const tk = this.peek();
    if (tk.t === "num") { this.next(); return { type: "num", v: tk.v }; }
    if (tk.t === "str") { this.next(); return { type: "str", v: tk.v }; }
    if (tk.t === "bool") { this.next(); return { type: "bool", v: tk.v }; }
    if (tk.t === "cell") {
      this.next();
      if (this.peek().v === ":") {
        this.next();
        const end = this.next();
        if (end.t !== "cell") throw new Error("Invalid range");
        return { type: "range", start: tk.v, end: end.v };
      }
      return { type: "cell", v: tk.v };
    }
    if (tk.t === "name") {
      this.next();
      this.eat("(");
      const args = [];
      if (this.peek().v !== ")") {
        args.push(this.parseExpr());
        while (this.peek().v === ",") { this.next(); args.push(this.parseExpr()); }
      }
      this.eat(")");
      return { type: "func", name: tk.v, args };
    }
    if (tk.v === "(") {
      this.next();
      const e = this.parseExpr();
      this.eat(")");
      return e;
    }
    throw new Error("Unexpected token");
  }
}

/* ---------- Evaluation ---------- */
function asNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  return null;
}
function isTruthy(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return v !== "" && v.toUpperCase() !== "FALSE";
  return false;
}
function flattenNumbers(args) {
  const out = [];
  for (const a of args) {
    if (a && a.__range) {
      for (const row of a.data) for (const v of row) {
        const n = asNumber(v);
        if (n !== null) out.push(n);
      }
    } else {
      const n = asNumber(a);
      if (n !== null) out.push(n);
    }
  }
  return out;
}
function flattenAll(args) {
  const out = [];
  for (const a of args) {
    if (a && a.__range) {
      for (const row of a.data) for (const v of row) out.push(v === "" ? "" : v);
    } else out.push(a);
  }
  return out;
}
function valuesEqual(a, b) {
  const na = asNumber(a), nb = asNumber(b);
  if (na !== null && nb !== null) return Math.abs(na - nb) < 1e-9;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}
function valuesLessEq(a, b) {
  const na = asNumber(a), nb = asNumber(b);
  if (na !== null && nb !== null) return na <= nb;
  return String(a) <= String(b);
}
function compareCriteria(cellVal, criteria) {
  if (typeof criteria === "number") return asNumber(cellVal) === criteria;
  const c = String(criteria);
  const m = c.match(/^(>=|<=|<>|>|<|=)(.*)$/);
  if (m) {
    const op = m[1], rest = m[2];
    const rn = asNumber(rest), cn = asNumber(cellVal);
    const bothNum = rn !== null && cn !== null;
    if (op === "=") return bothNum ? cn === rn : String(cellVal).toLowerCase() === rest.toLowerCase();
    if (op === "<>") return bothNum ? cn !== rn : String(cellVal).toLowerCase() !== rest.toLowerCase();
    if (bothNum) {
      if (op === ">") return cn > rn;
      if (op === "<") return cn < rn;
      if (op === ">=") return cn >= rn;
      if (op === "<=") return cn <= rn;
    } else {
      const cs = String(cellVal), rs = rest;
      if (op === ">") return cs > rs;
      if (op === "<") return cs < rs;
      if (op === ">=") return cs >= rs;
      if (op === "<=") return cs <= rs;
    }
  }
  const cn = asNumber(cellVal), rn = asNumber(criteria);
  if (cn !== null && rn !== null) return cn === rn;
  return String(cellVal).trim().toLowerCase() === c.trim().toLowerCase();
}
function isEmpty(v) { return v === "" || v === null || v === undefined; }

const FUNCS = {
  SUM: (args) => { const n = flattenNumbers(args); return n.reduce((s, x) => s + x, 0); },
  AVERAGE: (args) => { const n = flattenNumbers(args); if (!n.length) throw new Error("#DIV/0!"); return n.reduce((s, x) => s + x, 0) / n.length; },
  MIN: (args) => { const n = flattenNumbers(args); if (!n.length) throw new Error("#NUM!"); return Math.min(...n); },
  MAX: (args) => { const n = flattenNumbers(args); if (!n.length) throw new Error("#NUM!"); return Math.max(...n); },
  COUNT: (args) => flattenNumbers(args).length,
  IF: (args) => { if (args.length < 3) throw new Error("#VALUE!"); return isTruthy(args[0]) ? args[1] : args[2]; },
  AND: (args) => args.every(isTruthy),
  OR: (args) => args.some(isTruthy),
  ROUND: (args) => { const n = asNumber(args[0]), d = asNumber(args[1]); if (n === null || d === null) throw new Error("#VALUE!"); const f = Math.pow(10, d); return Math.round(n * f) / f; },
  ABS: (args) => { const n = asNumber(args[0]); if (n === null) throw new Error("#VALUE!"); return Math.abs(n); },
  INT: (args) => { const n = asNumber(args[0]); if (n === null) throw new Error("#VALUE!"); return Math.floor(n); },
  CONCAT: (args) => flattenAll(args).map((v) => (v === "" ? "" : String(v))).join(""),
  CONCATENATE: (args) => flattenAll(args).map((v) => (v === "" ? "" : String(v))).join(""),
  LEFT: (args) => String(args[0]).slice(0, asNumber(args[1])),
  RIGHT: (args) => { const s = String(args[0]); const n = asNumber(args[1]); return s.slice(s.length - n); },
  UPPER: (args) => String(args[0]).toUpperCase(),
  LOWER: (args) => String(args[0]).toLowerCase(),
  VLOOKUP: (args) => {
    const table = args[1];
    if (!table || !table.__range) throw new Error("#VALUE!");
    const colIndex = asNumber(args[2]);
    const rows = table.data;
    if (colIndex === null || colIndex < 1 || colIndex > rows[0].length) throw new Error("#REF!");
    const approx = isTruthy(args[3]); // TRUE => approximate; FALSE/0/omitted => exact
    if (!approx) {
      for (const r of rows) if (valuesEqual(r[0], args[0])) return r[colIndex - 1];
      throw new Error("#N/A");
    }
    let best = null;
    for (const r of rows) { if (valuesLessEq(r[0], args[0])) best = r; else break; }
    if (!best) throw new Error("#N/A");
    return best[colIndex - 1];
  },
  HLOOKUP: (args) => {
    const table = args[1];
    if (!table || !table.__range) throw new Error("#VALUE!");
    const rowIndex = asNumber(args[2]);
    const rows = table.data;
    if (rowIndex === null || rowIndex < 1 || rowIndex > rows.length) throw new Error("#REF!");
    const firstRow = rows[0];
    const approx = isTruthy(args[3]); // TRUE => approximate; FALSE/0/omitted => exact
    if (!approx) {
      for (let c = 0; c < firstRow.length; c++) if (valuesEqual(firstRow[c], args[0])) return rows[rowIndex - 1][c];
      throw new Error("#N/A");
    }
    let bestCol = -1;
    for (let c = 0; c < firstRow.length; c++) { if (valuesLessEq(firstRow[c], args[0])) bestCol = c; else break; }
    if (bestCol < 0) throw new Error("#N/A");
    return rows[rowIndex - 1][bestCol];
  },
  MATCH: (args) => {
    const arr = args[1];
    const sequence = (arr && arr.__range) ? arr.data.flat() : [args[1]];
    const target = args[0];
    const matchType = args[2] === undefined ? 1 : asNumber(args[2]);
    if (matchType === 0) {
      for (let i = 0; i < sequence.length; i++) if (valuesEqual(sequence[i], target)) return i + 1;
      throw new Error("#N/A");
    }
    if (matchType === 1) {
      let best = -1;
      for (let i = 0; i < sequence.length; i++) { if (valuesLessEq(sequence[i], target)) best = i; else break; }
      if (best < 0) throw new Error("#N/A");
      return best + 1;
    }
    let best = -1;
    for (let i = 0; i < sequence.length; i++) { if (valuesLessEq(target, sequence[i])) best = i; else break; }
    if (best < 0) throw new Error("#N/A");
    return best + 1;
  },
  INDEX: (args) => {
    const arr = args[0];
    if (!arr || !arr.__range) throw new Error("#VALUE!");
    const rows = arr.data;
    const rowNum = asNumber(args[1]);
    const colNum = args[2] === undefined ? 1 : asNumber(args[2]);
    if (rowNum === null || colNum === null) throw new Error("#VALUE!");
    const r = rows.length, c = rows[0].length;
    if (c === 1 && r > 1) {
      if (rowNum < 1 || rowNum > r) throw new Error("#REF!");
      return rows[rowNum - 1][0];
    }
    if (r === 1 && c > 1) {
      if (colNum < 1 || colNum > c) throw new Error("#REF!");
      return rows[0][colNum - 1];
    }
    if (rowNum < 1 || rowNum > r || colNum < 1 || colNum > c) throw new Error("#REF!");
    return rows[rowNum - 1][colNum - 1];
  },
  COUNTA: (args) => flattenAll(args).filter((v) => !isEmpty(v)).length,
  COUNTIF: (args) => {
    const range = args[0];
    if (!range || !range.__range) throw new Error("#VALUE!");
    const crit = args[1];
    let n = 0;
    for (const row of range.data) for (const v of row) if (!isEmpty(v) && compareCriteria(v, crit)) n++;
    return n;
  },
  COUNTIFS: (args) => {
    if (args.length < 2 || args.length % 2 !== 0) throw new Error("#VALUE!");
    const pairs = [];
    for (let i = 0; i < args.length; i += 2) {
      const r = args[i];
      if (!r || !r.__range) throw new Error("#VALUE!");
      pairs.push([r, args[i + 1]]);
    }
    const rows = pairs[0][0].data.length, cols = pairs[0][0].data[0].length;
    let count = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let ok = true;
      for (const [range, crit] of pairs) if (!compareCriteria(range.data[r][c], crit)) { ok = false; break; }
      if (ok) count++;
    }
    return count;
  },
  SUMIF: (args) => {
    const range = args[0];
    if (!range || !range.__range) throw new Error("#VALUE!");
    const crit = args[1];
    const sumRange = args.length >= 3 && args[2] && args[2].__range ? args[2] : range;
    const rows = range.data.length, cols = range.data[0].length;
    let total = 0, any = false;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (compareCriteria(range.data[r][c], crit)) {
        const n = asNumber(sumRange.data[r][c]);
        if (n !== null) { total += n; any = true; }
      }
    }
    if (!any) return 0;
    return total;
  },
  AVERAGEIF: (args) => {
    const range = args[0];
    if (!range || !range.__range) throw new Error("#VALUE!");
    const crit = args[1];
    const avgRange = args.length >= 3 && args[2] && args[2].__range ? args[2] : range;
    const rows = range.data.length, cols = range.data[0].length;
    let total = 0, count = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (compareCriteria(range.data[r][c], crit)) {
        const n = asNumber(avgRange.data[r][c]);
        if (n !== null) { total += n; count++; }
      }
    }
    if (!count) throw new Error("#DIV/0!");
    return total / count;
  },
  MEDIAN: (args) => {
    const n = flattenNumbers(args).slice().sort((a, b) => a - b);
    if (!n.length) throw new Error("#NUM!");
    const mid = Math.floor(n.length / 2);
    return n.length % 2 ? n[mid] : (n[mid - 1] + n[mid]) / 2;
  },
  MOD: (args) => { const a = asNumber(args[0]), b = asNumber(args[1]); if (a === null || b === null) throw new Error("#VALUE!"); if (b === 0) throw new Error("#DIV/0!"); return a - b * Math.floor(a / b); },
  POWER: (args) => { const a = asNumber(args[0]), b = asNumber(args[1]); if (a === null || b === null) throw new Error("#VALUE!"); return Math.pow(a, b); },
  SQRT: (args) => { const a = asNumber(args[0]); if (a === null) throw new Error("#VALUE!"); if (a < 0) throw new Error("#NUM!"); return Math.sqrt(a); },
  ROUNDUP: (args) => { const n = asNumber(args[0]), d = asNumber(args[1]); if (n === null || d === null) throw new Error("#VALUE!"); const f = Math.pow(10, d); return Math.ceil(n * f) / f; },
  ROUNDDOWN: (args) => { const n = asNumber(args[0]), d = asNumber(args[1]); if (n === null || d === null) throw new Error("#VALUE!"); const f = Math.pow(10, d); return Math.floor(n * f) / f; },
  LEN: (args) => String(args[0]).length,
  MID: (args) => { const s = String(args[0]), start = asNumber(args[1]), num = asNumber(args[2]); return s.substr(start - 1, num); },
  TRIM: (args) => String(args[0]).replace(/\s+/g, " ").trim(),
  PROPER: (args) => String(args[0]).replace(/(^|\s)(\S)/g, (_, sp, ch) => sp + ch.toUpperCase()),
  SUBSTITUTE: (args) => { const s = String(args[0]), old = String(args[1]), neu = String(args[2]); return s.split(old).join(neu); },
};

function evalNode(node, grid) {
  switch (node.type) {
    case "num": return node.v;
    case "str": return node.v;
    case "bool": return node.v;
    case "cell": return getCell(grid, node.v);
    case "range": return { __range: true, data: rangeData(grid, node.start, node.end) };
    case "unary": {
      const v = evalNode(node.operand, grid);
      const n = asNumber(v);
      if (n === null) throw new Error("#VALUE!");
      return node.op === "-" ? -n : n;
    }
    case "bin": {
      const a = evalNode(node.left, grid);
      const b = evalNode(node.right, grid);
      if (node.op === "&") return (a === "" ? "" : String(a)) + (b === "" ? "" : String(b));
      const na = asNumber(a), nb = asNumber(b);
      if (na === null || nb === null) throw new Error("#VALUE!");
      switch (node.op) {
        case "+": return na + nb;
        case "-": return na - nb;
        case "*": return na * nb;
        case "/": if (nb === 0) throw new Error("#DIV/0!"); return na / nb;
      }
      break;
    }
    case "cmp": {
      const a = evalNode(node.left, grid);
      const b = evalNode(node.right, grid);
      const na = asNumber(a), nb = asNumber(b);
      const an = na !== null && nb !== null;
      switch (node.op) {
        case "=": return an ? Math.abs(na - nb) < 1e-9 : String(a) === String(b);
        case "<>": return an ? Math.abs(na - nb) >= 1e-9 : String(a) !== String(b);
        case "<": return an ? na < nb : String(a) < String(b);
        case ">": return an ? na > nb : String(a) > String(b);
        case "<=": return an ? na <= nb : String(a) <= String(b);
        case ">=": return an ? na >= nb : String(a) >= String(b);
      }
      break;
    }
    case "func": {
      if (node.name === "IFERROR") {
        let val;
        try { val = evalNode(node.args[0], grid); }
        catch (e) { return evalNode(node.args[1], grid); }
        if (typeof val === "string" && val.startsWith("#")) return evalNode(node.args[1], grid);
        return val;
      }
      const fn = FUNCS[node.name];
      if (!fn) throw new Error("#NAME?");
      const args = node.args.map((a) => evalNode(a, grid));
      return fn(args);
    }
  }
  throw new Error("#ERROR!");
}

function evaluateFormula(formula, grid) {
  let src = String(formula).trim();
  if (src.startsWith("=")) src = src.slice(1);
  if (src === "") return "";
  const ast = new Parser(tokenize(src)).parseExpr();
  const result = evalNode(ast, grid);
  return result;
}

function formatValue(v) {
  if (v === "" || v === undefined || v === null) return "";
  if (typeof v === "number") {
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  }
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}
function matchesExpected(expected, actual) {
  if (typeof expected === "number" && typeof actual === "number") {
    return Math.abs(expected - actual) < 1e-9;
  }
  return String(expected).trim().toLowerCase() === String(actual).trim().toLowerCase();
}

/* ============================================================
   STATE / PROGRESS
   ============================================================ */
const STORAGE_KEY = "excelFormulaTrainer.v1";
function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function defaultState() {
  return {
    unlockedLevel: 1, xp: 0, practiceDone: {}, quizBest: {},
    streak: 0, lastActive: null, badges: {}, dailyDone: null, sound: true,
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) { return defaultState(); }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
let state = loadState();

/* ---------- Streak ---------- */
function touchStreak() {
  const key = todayKey();
  if (state.lastActive === key) return;
  if (state.lastActive) {
    const prev = new Date(state.lastActive), cur = new Date(key);
    const gap = Math.round((cur - prev) / 86400000);
    state.streak = gap === 1 ? state.streak + 1 : 1;
  } else {
    state.streak = 1;
  }
  state.lastActive = key;
  saveState();
}

/* ---------- Achievements ---------- */
const BADGES = {
  firstPractice: { icon: "🌱" },
  firstQuiz: { icon: "🧠" },
  streak3: { icon: "🔥" },
  allLevels: { icon: "🏆" },
  daily: { icon: "⭐" },
};
function awardBadge(id) {
  if (state.badges[id]) return false;
  state.badges[id] = todayKey();
  saveState();
  return true;
}
function checkStaticBadges() {
  if (Object.keys(state.practiceDone).length > 0) awardBadge("firstPractice");
  if (Object.keys(state.quizBest).length > 0) awardBadge("firstQuiz");
  if (state.streak >= 3) awardBadge("streak3");
  if (state.unlockedLevel > LEVELS.length) awardBadge("allLevels");
}

/* ---------- Sound (WebAudio, no files) ---------- */
let audioCtx = null;
function playSound(type) {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { success: [523.25, 659.25, 783.99], error: [311.13, 233.08], win: [523.25, 659.25, 783.99, 1046.5] }[type] || [523.25];
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "triangle"; o.frequency.value = f;
      const t0 = audioCtx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t0); o.stop(t0 + 0.24);
    });
  } catch (e) {}
}

/* ============================================================
   DOM HELPERS
   ============================================================ */
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "on" && typeof v === "object") {
      for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
    } else if (k === "dataset") Object.assign(node.dataset, v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

/* ============================================================
   I18N
   ============================================================ */
function detectLang() {
  const saved = localStorage.getItem("eft-lang");
  if (saved && I18N[saved]) return saved;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return I18N[nav] ? nav : "en";
}
let currentLang = detectLang();
function t(key, vars) {
  const table = I18N[currentLang] || I18N.en;
  let s = key in table ? table[key] : (key in I18N.en ? I18N.en[key] : key);
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split("{" + k + "}").join(v);
  return s;
}
function lvlName(lvl) {
  const m = LEVEL_META[lvl.id];
  return m && m[currentLang] ? m[currentLang].name : lvl.name;
}
function lvlTagline(lvl) {
  const m = LEVEL_META[lvl.id];
  return m && m[currentLang] ? m[currentLang].tagline : lvl.tagline;
}
function L(obj) {
  const tr = obj && obj.i18n && obj.i18n[currentLang];
  return tr ? Object.assign({}, obj, tr) : obj;
}
function renderLangSelect() {
  const sel = el("select", {
    class: "lang-select",
    "aria-label": t("lang.label"),
    on: { change: (e) => { currentLang = e.target.value; localStorage.setItem("eft-lang", currentLang); document.documentElement.lang = currentLang; render(); } },
  });
  for (const code of LANG_ORDER) {
    sel.appendChild(el("option", { value: code, selected: code === currentLang ? "true" : null }, [LANG_NAMES[code]]));
  }
  return sel;
}

/* ============================================================
   APP SHELL + RENDERING
   ============================================================ */
let currentTab = "learn";
let selectedLevelId = state.unlockedLevel;
let practiceFilter = "";
const root = document.getElementById("app");

function levelById(id) { return LEVELS.find((l) => l.id === id); }

function render() {
  touchStreak();
  checkStaticBadges();
  clear(root);
  root.appendChild(renderTopBar());
  root.appendChild(renderLevelPicker());
  if (currentTab === "learn") root.appendChild(renderDailyStrip());
  root.appendChild(renderTabs());
  const main = el("main", { class: "main" });
  if (currentTab === "learn") { main.appendChild(renderBadges()); main.appendChild(renderLearn()); }
  else if (currentTab === "practice") main.appendChild(renderPractice());
  else main.appendChild(renderQuiz());
  root.appendChild(main);
  root.appendChild(renderBottomNav());
  if (!document.querySelector(".cheat-fab")) {
    document.body.appendChild(el("button", {
      class: "cheat-fab", text: "📖 " + t("cheatsheet.open"),
      "aria-label": t("cheatsheet.open"),
      on: { click: openCheatSheet },
    }));
  }
}

function renderTopBar() {
  const lvl = levelById(selectedLevelId);
  const xpPct = Math.min(100, state.xp % 100);
  return el("header", { class: "topbar" }, [
    el("div", { class: "brand" }, [
      el("span", { class: "brand__logo", text: "📊" }),
      el("div", {}, [
        el("h1", { class: "brand__title", text: t("brand.title") }),
        el("p", { class: "brand__sub", text: t("brand.sub") }),
      ]),
    ]),
    el("div", { class: "topbar__right" }, [
      renderLangSelect(),
      el("div", { class: "levelchip" }, [
        el("span", { class: "levelchip__icon", text: lvl.icon }),
        el("span", { class: "levelchip__text" }, [
          el("strong", { text: t("level.chip", { id: lvl.id, name: lvlName(lvl) }) }),
        ]),
      ]),
      el("div", { class: "streakchip", title: t("streak.label") }, [
        el("span", { class: "streakchip__icon", text: state.streak > 0 ? "🔥" : "💤" }),
        el("span", { class: "streakchip__text", text: state.streak > 0 ? String(state.streak) : "0" }),
      ]),
      el("div", { class: "xp" }, [
        el("div", { class: "xp__row" }, [
          el("span", { class: "xp__label", text: t("xp", { n: state.xp }) }),
          el("div", { class: "topbar__icons" }, [
            el("button", { class: "ghost-btn", title: state.sound ? t("sound.on") : t("sound.off"), "aria-label": state.sound ? t("sound.on") : t("sound.off"), on: { click: () => { state.sound = !state.sound; saveState(); renderTopBarInto(); } }, text: state.sound ? "🔊" : "🔇" }),
            el("button", { class: "ghost-btn", title: theme === "dark" ? t("theme.toLight") : t("theme.toDark"), "aria-label": theme === "dark" ? t("theme.toLight") : t("theme.toDark"), on: { click: toggleTheme }, text: theme === "dark" ? "☀️" : "🌙" }),
          ]),
        ]),
        el("div", { class: "xp__bar" }, [el("div", { class: "xp__fill", style: "width:" + xpPct + "%" })]),
      ]),
    ]),
  ]);
}

function renderLevelPicker() {
  const wrap = el("nav", { class: "levelpick", "aria-label": "Levels" });
  for (const lvl of LEVELS) {
    const unlocked = lvl.id <= state.unlockedLevel;
    const active = lvl.id === selectedLevelId;
    const done = state.quizBest[lvl.id] !== undefined;
    wrap.appendChild(el("button", {
      class: "levelpill" + (active ? " is-active" : "") + (unlocked ? "" : " is-locked"),
      disabled: unlocked ? null : "true",
      title: unlocked ? lvlName(lvl) : t("level.lockedTooltip"),
      on: { click: () => { if (unlocked) { selectedLevelId = lvl.id; render(); } } },
    }, [
      el("span", { class: "levelpill__icon", text: unlocked ? lvl.icon : "🔒" }),
      el("span", { class: "levelpill__name", text: lvlName(lvl) }),
      done ? el("span", { class: "levelpill__check", text: "✓" }) : null,
    ]));
  }
  return wrap;
}

function renderTabs() {
  const tabs = [["learn", t("tab.learn")], ["practice", t("tab.practice")], ["quiz", t("tab.quiz")]];
  const nav = el("div", { class: "tabs", role: "tablist" });
  for (const [id, label] of tabs) {
    nav.appendChild(el("button", {
      class: "tab" + (currentTab === id ? " is-active" : ""),
      role: "tab",
      "aria-selected": currentTab === id ? "true" : "false",
      on: { click: () => { currentTab = id; render(); } },
    }, [label]));
  }
  return nav;
}

function renderBottomNav() {
  const items = [
    ["learn", "📚", t("nav.learn")],
    ["practice", "🧪", t("nav.practice")],
    ["quiz", "🎯", t("nav.quiz")],
  ];
  const nav = el("nav", { class: "bottomnav", "aria-label": "Primary" });
  for (const [id, icon, label] of items) {
    nav.appendChild(el("button", {
      class: "bottomnav__btn" + (currentTab === id ? " is-active" : ""),
      on: { click: () => { currentTab = id; render(); } },
    }, [
      el("span", { class: "bottomnav__icon", text: icon }),
      el("span", { class: "bottomnav__label", text: label }),
    ]));
  }
  return nav;
}

function renderBadges() {
  const wrap = el("section", { class: "badges" });
  wrap.appendChild(el("h2", { class: "badges__title", text: t("badges.title") }));
  const row = el("div", { class: "badges__row" });
  const owned = Object.keys(state.badges);
  if (!owned.length) {
    wrap.appendChild(el("p", { class: "muted", text: t("badges.none") }));
    return wrap;
  }
  for (const id of Object.keys(BADGES)) {
    if (!state.badges[id]) continue;
    row.appendChild(el("div", { class: "badge", title: t("badge." + id) }, [
      el("span", { class: "badge__icon", text: BADGES[id].icon }),
      el("span", { class: "badge__label", text: t("badge." + id) }),
    ]));
  }
  wrap.appendChild(row);
  return wrap;
}

function renderDailyStrip() {
  const wrap = el("section", { class: "daily" });
  const done = state.dailyDone === todayKey();
  wrap.appendChild(el("div", { class: "daily__head" }, [
    el("h2", { class: "daily__title", text: t("daily.title") }),
    done ? null : el("button", { class: "btn btn--primary daily__btn", text: t("daily.start"), on: { click: startDailyChallenge } }),
  ]));
  wrap.appendChild(el("p", { class: "muted", text: done ? t("daily.done") : t("daily.intro") }));
  return wrap;
}

function startDailyChallenge() {
  const allWrite = [];
  for (const lvl of LEVELS) for (const q of (lvl.quizzes || [])) if (q.type === "write") allWrite.push({ lvl, q });
  const pool = allWrite.length >= 5 ? allWrite : LEVELS.flatMap((l) => (l.quizzes || []).map((q) => ({ lvl: l, q })));
  const picks = [];
  const used = new Set();
  while (picks.length < Math.min(5, pool.length)) {
    const i = Math.floor(Math.random() * pool.length);
    if (used.has(i)) continue;
    used.add(i); picks.push(pool[i]);
  }
  currentTab = "quiz";
  render();
  // Build a synthetic daily quiz on top of the first picked level's quiz view.
  runDailyQuiz(picks);
}

function runDailyQuiz(picks) {
  const stage = root.querySelector(".main");
  clear(stage);
  let index = 0, correct = 0;
  const answered = new Array(picks.length).fill(false);
  const questions = picks.map((p) => Object.assign({ _lvl: p.lvl }, L(p.q)));
  function renderQ() {
    clear(stage);
    const item = questions[index];
    const q = item.q;
    const card = el("div", { class: "qcard" });
    card.appendChild(el("div", { class: "qcard__meta", text: t("question", { cur: index + 1, total: questions.length }) }));
    card.appendChild(el("p", { class: "qcard__prompt", text: q.prompt }));
    const bounds = gridBounds(q.grid);
    const table = buildGridTable(q.grid, bounds, q.targetCell);
    const fb = el("div", { class: "feedback", "aria-live": "polite" });
    const input = el("input", { class: "formula-input", type: "text", placeholder: "=FORMULA(...)", "aria-label": t("quiz.yourFormula") });
    const submit = el("button", { class: "btn btn--primary", text: t("submit") });
    const submitFn = () => {
      const raw = input.value.trim();
      if (!raw) { showFeedback(fb, t("typeFirst"), "warn"); return; }
      let computed;
      try { computed = evaluateFormula(raw, q.grid); }
      catch (e) { showFeedback(fb, t("invalid", { msg: e.message || "Invalid formula" }), "error"); return; }
      if (matchesExpected(q.expected, computed)) {
        showFeedback(fb, t("correct.write", { val: formatValue(computed) }), "ok");
        playSound("success"); markCorrect();
      } else {
        showFeedback(fb, t("wrong", { got: formatValue(computed), exp: formatValue(q.expected) }), "error");
        playSound("error");
      }
    };
    submit.addEventListener("click", submitFn);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submitFn(); });
    card.appendChild(el("div", { class: "grid-wrap" }, [table]));
    card.appendChild(el("div", { class: "practice__controls" }, [
      el("label", { class: "practice__label" }, [q.targetCell + ":", input]),
      el("div", { class: "btn-row" }, [submit]), fb,
    ]));
    stage.appendChild(card);
    stage.appendChild(el("div", { class: "btn-row quiz__nav" }, [
      index > 0 ? el("button", { class: "btn btn--ghost", text: t("back"), on: { click: () => { index--; renderQ(); } } }) : null,
      el("button", { class: "btn btn--primary", text: index === questions.length - 1 ? t("finish") : t("next"), on: { click: () => { if (index < questions.length - 1) { index++; renderQ(); } else finishDaily(); } } }),
    ]));
  }
  function markCorrect() { if (!answered[index]) { answered[index] = true; correct++; } }
  function finishDaily() {
    const score = correct / questions.length;
    const passed = score >= 0.6;
    clear(stage);
    if (passed) {
      touchStreak();
      const fresh = awardBadge("daily");
      saveState();
      playSound("win");
      if (fresh) showBadgeToast("daily");
      state.dailyDone = todayKey();
      saveState();
    }
    stage.appendChild(el("div", { class: "result" + (passed ? " is-pass" : " is-fail") }, [
      el("div", { class: "result__score", text: Math.round(score * 100) + "%" }),
      el("h3", { text: passed ? "🌟 " + t("pass.title") : t("fail.title") }),
      el("p", { class: "muted", text: passed ? t("daily.done") : t("fail.msg", { pct: 60 }) }),
      el("div", { class: "btn-row" }, [
        el("button", { class: "btn btn--primary", text: t("letsGo"), on: { click: () => { currentTab = "learn"; render(); } } }),
      ]),
    ]));
    renderTopBarInto();
  }
  renderQ();
}

function openCheatSheet() {
  const wrap = el("div", { class: "sheet", onclick: (e) => { if (e.target === wrap) wrap.remove(); } });
  const panel = el("div", { class: "sheet__panel" });
  panel.appendChild(el("div", { class: "sheet__head" }, [
    el("h2", { text: t("cheatsheet.title") }),
    el("button", { class: "ghost-btn", text: "✕", "aria-label": t("cheatsheet.close"), on: { click: () => wrap.remove() } }),
  ]));
  const list = el("div", { class: "sheet__list" });
  for (const lvl of LEVELS) for (const f of lvl.formulas.map(L)) {
    list.appendChild(el("div", { class: "sheet__item" }, [
      el("code", { class: "sheet__name", text: f.name }),
      el("code", { class: "sheet__syntax", text: f.syntax }),
    ]));
  }
  panel.appendChild(list);
  wrap.appendChild(panel);
  document.body.appendChild(wrap);
}

function showBadgeToast(id) {
  const toast = el("div", { class: "toast" }, [
    el("span", { class: "toast__icon", text: BADGES[id].icon }),
    el("span", { text: "🏅 " + t("badge." + id) }),
  ]);
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-show"));
  setTimeout(() => { toast.classList.remove("is-show"); setTimeout(() => toast.remove(), 400); }, 3200);
}

/* ---------- Learn ---------- */
function renderLearn() {
  const lvl = levelById(selectedLevelId);
  const wrap = el("section", { class: "learn" });
  wrap.appendChild(el("div", { class: "learn__head" }, [
    el("h2", { text: t("learn.head", { icon: lvl.icon, id: lvl.id, name: lvlName(lvl) }) }),
    el("p", { class: "muted", text: lvlTagline(lvl) }),
  ]));

  if (lvl.id > state.unlockedLevel) {
    wrap.appendChild(el("div", { class: "locked-note", text: t("locked.note") }));
    return wrap;
  }

  const list = el("div", { class: "cards" });
  wrap.appendChild(el("input", {
    class: "search", type: "search", placeholder: t("search.placeholder"),
    value: practiceFilter, on: { input: (e) => { practiceFilter = e.target.value; renderLearnInto(list, lvl); } },
  }));
  wrap.appendChild(list);
  renderLearnInto(list, lvl);
  return wrap;
}
function renderLearnInto(list, lvl) {
  clear(list);
  const q = practiceFilter.trim().toLowerCase();
  const formulas = lvl.formulas.map(L).filter((f) =>
    !q || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.syntax.toLowerCase().includes(q)
  );
  if (!formulas.length) { list.appendChild(el("p", { class: "muted", text: t("learn.none") })); return; }
  for (const f of formulas) {
    list.appendChild(el("article", { class: "card" }, [
      el("header", { class: "card__head" }, [
        el("h3", { class: "card__name", text: f.name }),
      ]),
      el("code", { class: "card__syntax", text: f.syntax }),
      el("p", { class: "card__desc", text: f.description }),
      el("div", { class: "card__example" }, [
        el("span", { class: "card__exlabel", text: t("example.label") }),
        el("code", { text: f.example }),
        el("p", { class: "card__exresult", text: t("example.result", { r: f.result }) }),
      ]),
    ]));
  }
}

/* ---------- Practice ---------- */
function renderPractice() {
  const lvl = levelById(selectedLevelId);
  const wrap = el("section", { class: "practice" });
  wrap.appendChild(el("div", { class: "learn__head" }, [
    el("h2", { text: t("practice.head", { name: lvlName(lvl) }) }),
    el("p", { class: "muted", text: t("practice.intro") }),
  ]));

  if (lvl.id > state.unlockedLevel) {
    wrap.appendChild(el("div", { class: "locked-note", text: t("locked.note") }));
    return wrap;
  }

  const picker = el("div", { class: "scenariopick" });
  lvl.practices.forEach((p, idx) => {
    const pL = L(p);
    picker.appendChild(el("button", {
      class: "scenario-btn", on: { click: () => renderScenario(wrap, lvl, pL) },
    }, [String(idx + 1) + ". " + pL.title]));
  });
  wrap.appendChild(picker);

  const stage = el("div", { class: "stage" });
  wrap.appendChild(stage);
  if (lvl.practices.length) renderScenario(stage, lvl, L(lvl.practices[0]));
  return wrap;
}
function renderScenario(stage, lvl, scenario) {
  clear(stage);

  const bounds = gridBounds(scenario.grid);
  const table = buildGridTable(scenario.grid, bounds, scenario.targetCell);

  const feedback = el("div", { class: "feedback", "aria-live": "polite" });
  const resultLine = el("div", { class: "result-line" });
  const input = el("input", {
    class: "formula-input", type: "text", placeholder: "=SUM(...)",
    "aria-label": t("practice.formulaFor", { cell: scenario.targetCell }),
  });

  const checkBtn = el("button", { class: "btn btn--primary", text: t("check") });
  const hintBtn = el("button", { class: "btn", text: t("hint") });
  const solBtn = el("button", { class: "btn btn--ghost", text: t("solution") });

  const doCheck = () => {
    const raw = input.value.trim();
    if (!raw) { showFeedback(feedback, t("typeFirst"), "warn"); return; }
    let computed;
    try { computed = evaluateFormula(raw, scenario.grid); }
    catch (e) { showFeedback(feedback, t("invalid", { msg: e.message || "Invalid formula" }), "error"); resultLine.textContent = ""; return; }
    const formatted = formatValue(computed);
    resultLine.textContent = scenario.targetCell + " = " + (raw.startsWith("=") ? raw : "=" + raw) + "  →  " + formatted;
    if (matchesExpected(scenario.expected, computed)) {
      showFeedback(feedback, t("correct"), "ok");
      playSound("success");
      if (!state.practiceDone[scenario.id]) {
        state.practiceDone[scenario.id] = true;
        state.xp += XP_PER_PRACTICE;
        touchStreak();
        const fresh = awardBadge("firstPractice");
        saveState();
        if (fresh) showBadgeToast("firstPractice");
      }
    } else {
      showFeedback(feedback, t("notQuite", { got: formatted, exp: formatValue(scenario.expected) }), "error");
    }
  };
  checkBtn.addEventListener("click", doCheck);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") doCheck(); });
  hintBtn.addEventListener("click", () => showFeedback(feedback, t("hint.text", { hint: scenario.hint }), "warn"));
  solBtn.addEventListener("click", () => {
    showFeedback(feedback, t("solution.text", { sol: scenario.solution }), "ok");
    input.value = scenario.solution;
  });

  stage.appendChild(el("div", { class: "scenario" }, [
    el("p", { class: "scenario__prompt", text: scenario.prompt }),
    el("div", { class: "grid-wrap" }, [table]),
    el("div", { class: "practice__controls" }, [
      el("label", { class: "practice__label" }, [scenario.targetCell + ":", input]),
      el("div", { class: "btn-row" }, [checkBtn, hintBtn, solBtn]),
      resultLine,
      feedback,
    ]),
  ]));
}

/* ---------- Quiz ---------- */
function renderQuiz() {
  const lvl = levelById(selectedLevelId);
  const wrap = el("section", { class: "quiz" });
  wrap.appendChild(el("div", { class: "learn__head" }, [
    el("h2", { text: t("quiz.head", { name: lvlName(lvl) }) }),
    el("p", { class: "muted", text: t("quiz.intro", { pct: Math.round(PASS_THRESHOLD * 100) }) }),
  ]));

  if (lvl.id > state.unlockedLevel) {
    wrap.appendChild(el("div", { class: "locked-note", text: t("locked.note") }));
    return wrap;
  }

  const questions = lvl.quizzes.map(L);
  let index = 0;
  let correct = 0;
  const answered = new Array(questions.length).fill(false);

  const stage = el("div", { class: "stage" });

  function renderQuestion() {
    clear(stage);
    const q = questions[index];
    const card = el("div", { class: "qcard" });
    card.appendChild(el("div", { class: "qcard__meta", text: t("question", { cur: index + 1, total: questions.length }) }));
    card.appendChild(el("p", { class: "qcard__prompt", text: q.prompt }));

    if (q.type === "mc") {
      const opts = el("div", { class: "options" });
      q.options.forEach((opt, oi) => {
        const b = el("button", { class: "option", on: { click: () => choose(oi, b, opts) } }, [opt]);
        opts.appendChild(b);
      });
      card.appendChild(opts);
    } else {
      // write-type
      const bounds = gridBounds(q.grid);
      const table = buildGridTable(q.grid, bounds, q.targetCell);
      const fb = el("div", { class: "feedback", "aria-live": "polite" });
      const input = el("input", { class: "formula-input", type: "text", placeholder: "=FORMULA(...)", "aria-label": t("quiz.yourFormula") });
      const submit = el("button", { class: "btn btn--primary", text: t("submit") });
      const submitFn = () => {
        const raw = input.value.trim();
        if (!raw) { showFeedback(fb, t("typeFirst"), "warn"); return; }
        let computed;
        try { computed = evaluateFormula(raw, q.grid); }
        catch (e) { showFeedback(fb, t("invalid", { msg: e.message || "Invalid formula" }), "error"); return; }
        if (matchesExpected(q.expected, computed)) {
          showFeedback(fb, t("correct.write", { val: formatValue(computed) }), "ok");
          playSound("success");
          markCorrect();
        } else {
          showFeedback(fb, t("wrong", { got: formatValue(computed), exp: formatValue(q.expected) }), "error");
          playSound("error");
        }
      };
      submit.addEventListener("click", submitFn);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") submitFn(); });
      card.appendChild(el("div", { class: "grid-wrap" }, [table]));
      card.appendChild(el("div", { class: "practice__controls" }, [
        el("label", { class: "practice__label" }, [q.targetCell + ":", input]),
        el("div", { class: "btn-row" }, [submit]),
        fb,
      ]));
    }
    stage.appendChild(card);
    stage.appendChild(el("div", { class: "btn-row quiz__nav" }, [
      index > 0 ? el("button", { class: "btn btn--ghost", text: t("back"), on: { click: () => { index--; renderQuestion(); } } }) : null,
      el("button", { class: "btn btn--primary", text: index === questions.length - 1 ? t("finish") : t("next"), on: { click: next } }),
    ]));
  }

  function choose(oi, btn, opts) {
    if (answered[index]) return;
    answered[index] = true;
    const q = questions[index];
    const isRight = oi === q.answer;
    if (isRight) { correct++; btn.classList.add("is-correct"); playSound("success"); }
    else { btn.classList.add("is-wrong"); opts.children[q.answer].classList.add("is-correct"); playSound("error"); }
    Array.from(opts.children).forEach((c) => (c.disabled = true));
  }
  function markCorrect() { if (!answered[index]) { answered[index] = true; correct++; } }
  function next() {
    if (index < questions.length - 1) { index++; renderQuestion(); }
    else finish();
  }
  function finish() {
    const score = correct / questions.length;
    const passed = score >= PASS_THRESHOLD;
    clear(stage);
    const prevBest = state.quizBest[lvl.id] || 0;
    if (score > prevBest) state.quizBest[lvl.id] = score;
    if (passed) {
      touchStreak();
      const fresh = awardBadge("firstQuiz");
      state.xp += XP_PER_QUIZ;
      saveState();
      checkStaticBadges();
      playSound("win");
      if (fresh) showBadgeToast("firstQuiz");
      if (lvl.id === state.unlockedLevel && state.unlockedLevel < LEVELS.length) {
        state.unlockedLevel++;
        selectedLevelId = state.unlockedLevel;
        showCelebration(levelById(state.unlockedLevel));
      }
    } else {
      saveState();
    }
    stage.appendChild(el("div", { class: "result" + (passed ? " is-pass" : " is-fail") }, [
      el("div", { class: "result__score", text: Math.round(score * 100) + "%" }),
      el("h3", { text: passed ? t("pass.title") : t("fail.title") }),
      el("p", { class: "muted", text: passed
        ? (lvl.id < LEVELS.length ? t("pass.msg", { name: levelById(lvl.id + 1).icon + " " + lvlName(levelById(lvl.id + 1)) }) : t("master.msg", {}))
        : t("fail.msg", { pct: Math.round(PASS_THRESHOLD * 100) }) }),
      el("div", { class: "btn-row" }, [
        el("button", { class: "btn btn--primary", text: t("retake"), on: { click: () => { index = 0; correct = 0; answered.fill(false); renderQuestion(); } } }),
        lvl.id < LEVELS.length && passed ? el("button", { class: "btn", text: t("goNext"), on: { click: () => { selectedLevelId = state.unlockedLevel; currentTab = "learn"; render(); } } }) : null,
      ]),
    ]));
    renderTopBarInto();
  }

  renderQuestion();
  wrap.appendChild(stage);
  return wrap;
}

/* ---------- Shared grid renderer ---------- */
function gridBounds(grid) {
  let maxC = 0, maxR = 0;
  for (const ref of Object.keys(grid)) {
    const p = parseCell(ref);
    if (p.col > maxC) maxC = p.col;
    if (p.row > maxR) maxR = p.row;
  }
  return { cols: maxC, rows: maxR };
}
function buildGridTable(grid, bounds, targetCell) {
  const table = el("table", { class: "grid" });
  const thead = el("tr");
  thead.appendChild(el("th", { class: "grid__corner" }));
  for (let c = 0; c <= bounds.cols; c++) thead.appendChild(el("th", { class: "grid__col", text: colLetter(c) }));
  table.appendChild(thead);
  for (let r = 0; r <= bounds.rows; r++) {
    const tr = el("tr");
    tr.appendChild(el("th", { class: "grid__row", text: String(r + 1) }));
    for (let c = 0; c <= bounds.cols; c++) {
      const ref = colLetter(c) + (r + 1);
      const isTarget = ref === targetCell;
      if (isTarget) {
        tr.appendChild(el("td", { class: "grid__cell grid__cell--target" }, [
          el("span", { class: "grid__ref", text: ref }),
        ]));
      } else {
        const val = grid[ref];
        tr.appendChild(el("td", { class: "grid__cell" + (val === undefined ? " grid__cell--empty" : "") }, [
          val === undefined ? el("span", { class: "grid__ref", text: ref }) : el("span", { class: "grid__val", text: formatValue(val) }),
        ]));
      }
    }
    table.appendChild(tr);
  }
  return table;
}

/* ---------- Feedback + celebration ---------- */
function showFeedback(node, msg, kind) {
  node.className = "feedback feedback--" + kind;
  node.textContent = msg;
}
function renderTopBarInto() {
  const old = root.querySelector(".topbar");
  if (old) old.replaceWith(renderTopBar());
  const oldPick = root.querySelector(".levelpick");
  if (oldPick) oldPick.replaceWith(renderLevelPicker());
}
function showCelebration(lvl) {
  playSound("win");
  const overlay = el("div", { class: "celebrate" }, [
    el("div", { class: "celebrate__card" }, [
      el("div", { class: "celebrate__emoji", text: "🎊" }),
      el("h2", { text: t("levelUp") }),
      el("p", { text: t("unlocked", { icon: lvl.icon, name: lvlName(lvl) }) }),
      el("div", { class: "confetti" }),
      el("button", { class: "btn btn--primary", text: t("letsGo"), on: { click: () => { overlay.remove(); render(); } } }),
    ]),
  ]);
  document.body.appendChild(overlay);
}

/* ---------- Theme ---------- */
let theme = localStorage.getItem("eft-theme");
if (!theme) {
  theme = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
}
function applyTheme() { document.documentElement.setAttribute("data-theme", theme); }
function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("eft-theme", theme);
  applyTheme();
  render();
}

/* ---------- Init ---------- */
applyTheme();
document.documentElement.lang = currentLang;
render();
