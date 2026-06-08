type IOSSwitchProps = {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  labelOn?: string;
  labelOff?: string;
};

export function IOSSwitch({
  checked,
  onChange,
  disabled = false,
  labelOn = "ACTIVADO",
  labelOff = "DESACTIVADO",
}: IOSSwitchProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? labelOn : labelOff}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full p-[2px] transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-success" : "bg-slate-300"
        }`}
      >
        <span
          aria-hidden
          className={`pointer-events-none block h-[14px] w-[14px] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.22)] transition-transform duration-200 ease-out ${
            checked ? "translate-x-[14px]" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-[7px] font-black uppercase tracking-wider leading-none ${
          checked ? "text-success" : "text-muted"
        }`}
      >
        {checked ? labelOn : labelOff}
      </span>
    </div>
  );
}
