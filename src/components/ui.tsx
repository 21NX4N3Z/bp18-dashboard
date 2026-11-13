import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { IconAlert, IconCheckCircle, IconInfo, IconMinus, IconX } from "./icons";

/* ---------- Card ---------- */

export function Card({
  children,
  className = "",
  style,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={"card " + className} style={style}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  actions,
  icon,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card-head">
      <div className="card-head-text">
        <h2 className="card-title">
          {icon ? <span className="card-title-icon">{icon}</span> : null}
          {title}
        </h2>
        {subtitle ? <p className="card-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="card-actions">{actions}</div> : null}
    </div>
  );
}

/* ---------- Badge ---------- */

const TONE_ICON = {
  ok: IconCheckCircle,
  warn: IconAlert,
  danger: IconAlert,
  info: IconInfo,
  dim: IconMinus,
};

export function Badge({
  tone = "dim",
  children,
  icon = true,
}: {
  tone?: "ok" | "warn" | "danger" | "info" | "dim";
  children: ReactNode;
  icon?: boolean;
}) {
  const Icon = TONE_ICON[tone];
  return (
    <span className={"badge badge-" + tone}>
      {icon && <Icon size={12} strokeWidth={2.2} />}
      {children}
    </span>
  );
}

/* ---------- Button ---------- */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md";
  block?: boolean;
};

export function Button({ variant = "ghost", size = "md", block, className = "", style, ...rest }: BtnProps) {
  return (
    <button
      className={
        "btn btn-" + variant + " btn-" + size + (block ? " btn-block" : "") + (className ? " " + className : "")
      }
      style={style}
      {...rest}
    />
  );
}

export function IconButton({
  label,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button className={"icon-btn " + className} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Progress ---------- */

export function Progress({ value, tone = "accent", height = 8 }: { value: number; tone?: "accent" | "ok" | "warn" | "danger"; height?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ height }}
    >
      <div className={"progress-fill progress-" + tone} style={{ width: clamped + "%" }} />
    </div>
  );
}

/* ---------- Radial ring ---------- */

export function Ring({
  value,
  size = 120,
  thickness = 10,
  label,
  sub,
}: {
  value: number;
  size?: number;
  thickness?: number;
  label?: string;
  sub?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={label ? label + " " + Math.round(clamped) + " percent" : undefined}>
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-fill"
          strokeWidth={thickness}
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
        />
      </svg>
      <div className="ring-center">
        <div className="ring-value">{label ?? Math.round(clamped) + "%"}</div>
        {sub ? <div className="ring-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useRef("modal-" + Math.random().toString(36).slice(2, 8)).current;

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const prev = document.activeElement as HTMLElement | null;
    const focusable = node?.querySelector<HTMLElement>(
      "input, select, textarea, button:not([data-close])"
    );
    focusable?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const all = Array.from(
        node.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex='-1'])")
      ).filter((el) => el.offsetParent !== null);
      if (!all.length) return;
      const first = all[0];
      const last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey, true);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
        style={{ width }}
      >
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          <IconButton label="Close dialog" data-close onClick={onClose}>
            <IconX size={18} />
          </IconButton>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------- Form ---------- */

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={"field " + className}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input select" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input textarea" {...props} />;
}

/* ---------- Switch ---------- */

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={"switch" + (checked ? " switch-on" : "")}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-track">
        <span className="switch-thumb" />
      </span>
      <span className="switch-text">
        <span className="switch-label">{label}</span>
        {description ? <span className="switch-desc">{description}</span> : null}
      </span>
      <span className="switch-state" aria-hidden="true">
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}

/* ---------- Segmented ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={"segmented-item" + (value === o.value ? " segmented-active" : "")}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Empty state ---------- */

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-mark" aria-hidden="true" />
      <div className="empty-title">{title}</div>
      {hint ? <div className="empty-hint">{hint}</div> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

/* ---------- Avatar ---------- */

const AVATAR_HUE = [210, 160, 20, 340, 265, 45, 190, 15, 285, 120];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  const hue = AVATAR_HUE[h % AVATAR_HUE.length];
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: "hsl(" + hue + " 42% 22%)",
        border: "1px solid hsl(" + hue + " 55% 34%)",
        color: "hsl(" + hue + " 70% 78%)",
      }}
    >
      {initials || "?"}
    </span>
  );
}

/* ---------- Key / value ---------- */

export function KV({ k, v, mono = true }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="kv">
      <span className="kv-k">{k}</span>
      <span className={"kv-v" + (mono ? " mono" : "")}>{v}</span>
    </div>
  );
}
