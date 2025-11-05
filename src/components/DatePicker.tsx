import { useEffect, useMemo, useRef, useState } from "react";

type DateRange = { startDate: Date | null; endDate: Date | null };

type Props = {
  value?: DateRange;
  onChange?: (r: DateRange) => void;
  onApply?: (r: DateRange) => void;
  onClear?: () => void;
  onClose?: () => void;
  primaryColor?: "sky" | "blue" | "indigo" | string;
};

const sameDay = (a?: Date | null, b?: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const fmt = (d: Date | null) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";

const isBetween = (d: Date, a: Date | null, b: Date | null) => {
  if (!a || !b) return false;
  const t = d.getTime();
  return (t > a.getTime() && t < b.getTime()) || (t > b.getTime() && t < a.getTime());
};

const primaryMap: Record<string, string> = {
  sky: "from-sky-500 to-sky-700",
  blue: "from-blue-500 to-blue-700",
  indigo: "from-indigo-500 to-indigo-700",
};

export default function SingleRangeDatepicker({
  value,
  onChange,
  onApply,
  onClear,
  onClose,
  primaryColor = "sky",
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(startOfMonth(today));
  const [start, setStart] = useState<Date | null>(value?.startDate ?? null);
  const [end, setEnd] = useState<Date | null>(value?.endDate ?? null);
  const ref = useRef<HTMLDivElement | null>(null);

  // close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      setOpen(false);
      onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // open/close button text
  const label =
    start && end
      ? `${fmt(start)} – ${fmt(end)}`
      : start
      ? `${fmt(start)} – `
      : "Select date range";

      // Oncselect logic
  const onSelect = (d: Date) => {
    if (!start || (start && end)) {
      setStart(d);
      setEnd(null);
      onChange?.({ startDate: d, endDate: null });
    } else if (start && !end) {
      if (d.getTime() < start.getTime()) {
        setEnd(start);
        setStart(d);
        onChange?.({ startDate: d, endDate: start });
      } else {
        setEnd(d);
        onChange?.({ startDate: start, endDate: d });
      }
    }
  };

//   code to render a single month
  const renderMonth = (base: Date) => {
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const total = daysInMonth(base);
    const firstWeekday = firstDay.getDay();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);


    return (
      <div className="w-[320px] p-3 ">
        <div className="flex justify-center mb-2 font-medium text-slate-700">
          {base.toLocaleString(undefined, { month: "long" })} {year}
        </div>
        <div className="grid grid-cols-7 text-xs text-slate-500 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {cells.map((c, i) =>
            c ? (
              <button
                key={i}
                onClick={() => onSelect(c)}
                className={`h-9 flex items-center justify-center rounded-full relative ${
                  sameDay(c, start) || sameDay(c, end)
                    ? `text-white bg-gradient-to-r ${primaryMap[primaryColor] ?? primaryMap["sky"]}`
                    : isBetween(c, start, end)
                    ? "bg-slate-200 text-slate-800"
                    : "hover:bg-slate-100 text-slate-700"
                } ${sameDay(c, today) && !sameDay(c, start) && !sameDay(c, end) ? "ring-1 ring-slate-300" : ""}`}
              >
                {c.getDate()}
              </button>
            ) : (
              <div key={i} className="h-9" />
            )
          )}
        </div>
      </div>
    );
  };

  const handleClear = () => {
    setStart(null);
    setEnd(null);
    onClear?.();
 onClose?.();

  };

  const handleApply = () => {
    onApply?.({ startDate: start, endDate: end });
    setOpen(false);
    
  };

//   const handleClose = () => {
//     setOpen(false);
//     onClose?.();
//   };

  return (
    <div className="bg-white  text-sm max-w-[600px] sm:max-w-[480px] md:max-w-[auto] lg:max-w-auto" ref={ref}>
        <div className=" inline-block text-sm w-full sm:w-auto relative left-0 cont-available " ref={ref}>

      {/* input */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
            overflow: "visible"
        }}
        className="w-full flex items-center justify-between border rounded-md bg-white px-3 py-2"
      >
        <span className="text-slate-700">{label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-4 h-4 ml-2 transform transition-transform ${
            open ? "rotate-180" : "rotate-0"
          } text-slate-500`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* popover */}
      {open && (
     <div
  id="inbox-filter-popover"
  className="absolute left-0 mt-1 z-50 bg-white border rounded shadow-lg p-3  w-[650px]: overflow-hidden"
  role="dialog"
  aria-modal="false"
>

          <label className="text-xs text-slate-600">Date Range</label>

          {/* header controls */}
          <div className="flex justify-between items-center my-1">
            <button
              onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
              className="p-2 hover:bg-slate-100 rounded"
            >
              ‹
            </button>
            <div className="font-medium text-slate-700">Select Dates</div>
            <button
              onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
              className="p-2 hover:bg-slate-100 rounded"
            >
              ›
            </button>
          </div>

          {/* two-month view */}
          <div className="flex gap-4 overflow-x-auto">
            {renderMonth(monthCursor)}
            {renderMonth(addMonths(monthCursor, 1))}
          </div>

          {/* footer actions */}
          <div className="flex justify-end gap-2 mt-2">
            

            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded border text-sm bg-sky-700/75 text-white"
                onClick={handleClear}
              >
                Clear
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-sky-700 text-white text-sm"
                onClick={handleApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
