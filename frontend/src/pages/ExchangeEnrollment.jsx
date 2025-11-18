// Static HTML/CSS/JS enrollment form as provided
const ENROLLMENT_FORM = `
<section id="simple1031-calculator">
  <style>
    :root { --s1031-navy: #10174a; --s1031-navy-soft: #182166; --s1031-yellow: #fcd300; --s1031-blue: #4aa0e2; --s1031-bg: #f5f6fb; --s1031-border: #dde2f0; --s1031-text-main: #111827; --s1031-text-soft: #6b7280; --s1031-radius: 10px; --s1031-font: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; --field-width: 220px; }
    #simple1031-calculator { font-family: var(--s1031-font); background: var(--s1031-bg); padding: 24px 18px 40px; color: var(--s1031-text-main); }
    #s1031-wrap { max-width: 980px; margin: 0 auto; background: #ffffff; padding: 18px 18px 20px; border-radius: 16px; border: 1px solid var(--s1031-border); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    #s1031-title { font-size: 18px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--s1031-navy); font-weight: 700; margin: 0 0 4px; }
    #s1031-subtitle { font-size: 11px; color: var(--s1031-text-soft); margin: 0 0 14px; }
    .s1031-toggle { display: inline-flex; border-radius: 999px; border: 1px solid var(--s1031-border); overflow: hidden; margin-bottom: 14px; background: #ffffff; }
    .s1031-toggle button { padding: 6px 16px; border: none; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; cursor: pointer; background: transparent; color: var(--s1031-text-soft); font-weight: 600; }
    .s1031-toggle button.active { background: var(--s1031-navy); color: #ffffff; }
    .s1031-section { margin-top: 8px; padding: 10px 10px 8px; border-radius: var(--s1031-radius); border: 1px solid var(--s1031-border); background: #ffffff; }
    .s1031-section-title { font-size: 10px; font-weight: 700; color: var(--s1031-navy); text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 4px; }
    .s1031-row { display: flex; align-items: center; margin-bottom: 4px; gap: 8px; }
    .s1031-label { flex: 0 0 210px; font-size: 10px; color: var(--s1031-text-soft); }
    .s1031-input-wrap { flex: 0 0 var(--field-width); }
    .s1031-input { width: 100%; padding: 5px 7px; border-radius: 6px; border: 1px solid var(--s1031-border); font-size: 11px; text-align: right; color: var(--s1031-text-main); background: #f9fafb; }
    .s1031-input::placeholder { text-align: left; color: #9ca3af; }
    .s1031-input-date { text-align: left; }
    .s1031-note { margin-left: 210px; font-size: 9px; color: var(--s1031-text-soft); margin-bottom: 4px; }
    .s1031-summary { margin-top: 6px; padding: 8px 9px; border-radius: 8px; background: #fff9e6; border: 1px solid #f6e3a1; font-size: 10px; color: #43302b; line-height: 1.5; }
    .s1031-summary strong { color: #b45309; }
    .s1031-inline { font-size: 9px; color: var(--s1031-text-soft); margin-top: 2px; }
    .s1031-error { margin-left: 210px; font-size: 9px; color: #b91c1c; display: none; }
    .s1031-btn-row { margin-top: 10px; display: flex; justify-content: flex-end; gap: 10px; align-items: center; }
    .s1031-btn { padding: 7px 16px; border-radius: 999px; border: none; background: var(--s1031-yellow); color: #111827; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.16); }
    .s1031-btn:hover { background: #ffe463; }
    #s1031-exchange-id { display: none; margin-top: 6px; padding: 6px 9px; border-radius: 8px; background: #ecfdf5; border: 1px solid #bbf7d0; font-size: 9px; color: #065f46; }
    #s1031-detailed { display: none; }
    .s1031-detail-output { font-size: 9px; color: var(--s1031-navy); text-align: right; min-width: 80px; }
    #s1031-adv-summary { margin-top: 6px; padding: 7px 8px; border-radius: 8px; background: #f3f4ff; border: 1px solid var(--s1031-border); font-size: 9px; line-height: 1.5; display: none; }
  </style>
  ...[REMAINDER OF YOUR HTML/JS CONTENT HERE]...
</section>
`;

export default function ExchangeEnrollment() {
  return <div dangerouslySetInnerHTML={{ __html: ENROLLMENT_FORM }} />;
}
