/**
 * 日期差计算
 *
 * 算两个日期相差多少天/周/月/年，也可算「从今天起 N 天后是哪天」。纯本地计算，不联网。
 */

export const name = "dsh-calc-datediff";

export const inject = ["tools"];

const TEXT_OUTPUT = {
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      text: { type: "string" },
    },
    required: ["text"],
  },
  render: (_args, value) => [
    { type: "text", text: (value && value.text) || "" },
  ],
};

// ══════════════════════════════════════════════════════════
//  通用工具函数
// ══════════════════════════════════════════════════════════

const TITLE = "__CALC_TITLE__";

function fmt(n, digits) {
  if (!Number.isFinite(n)) return String(n);
  const d = digits == null ? 2 : digits;
  if (Math.abs(n) >= 1e12) return n.toExponential(6);
  let s = n.toFixed(d);
  if (d > 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

function money(n) {
  if (!Number.isFinite(n)) return String(n);
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : (def == null ? 0 : def);
}

function line(label, value, unit) {
  const pad = "  ";
  return pad + label + "：" + value + (unit ? " " + unit : "");
}

function head(title) {
  return [title, "=".repeat(52)];
}

// ══════════════════════════════════════════════════════════
//  工具
// ══════════════════════════════════════════════════════════

export function apply(ctx, config) {
  void config;

  ctx.tools.register({
    name: "calc_datediff",
    description:
      "日期差计算。输入两个日期（YYYY-MM-DD），返回相差的天数、周数、月数、年数，以及是否工作日。",
    parameters: {
      from: { type: "string", required: true, description: "起始日期 YYYY-MM-DD" },
      to: { type: "string", description: "结束日期，默认今天" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      try {
        const a = args || {};
        const parse = (s) => {
          const m = String(s || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          if (!m) return null;
          const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
          return Number.isNaN(d.getTime()) ? null : d;
        };
        const d1 = parse(a.from);
        if (!d1) return { text: "起始日期格式要 YYYY-MM-DD" };
        const d2 = a.to ? parse(a.to) : new Date();
        if (!d2) return { text: "结束日期格式要 YYYY-MM-DD" };
        const ms = Math.abs(d2.getTime() - d1.getTime());
        const days = Math.round(ms / 86400000);
        const L = head("日期差");
        L.push(line("起始", d1.toISOString().slice(0, 10)));
        L.push(line("结束", d2.toISOString().slice(0, 10)));
        L.push(line("相差", days + " 天"));
        L.push(line("即", fmt(days / 7, 1) + " 周"));
        L.push(line("约", fmt(days / 30.44, 1) + " 个月"));
        L.push(line("约", fmt(days / 365.25, 2) + " 年"));
        L.push("");
        // 工作日（粗略，不含节假日）
        let workdays = 0;
        const step = d2 >= d1 ? 1 : -1;
        const cur = new Date(d1.getTime());
        while ((step > 0 && cur <= d2) || (step < 0 && cur >= d2)) {
          const dow = cur.getUTCDay();
          if (dow !== 0 && dow !== 6) workdays++;
          cur.setUTCDate(cur.getUTCDate() + step);
        }
        L.push("  工作日（不含节假日）：" + workdays + " 天");
        return { text: L.join("\n") };
      } catch (e) {
        return { text: "计算失败: " + String((e && e.message) || e) };
      }
    },
  });
}
