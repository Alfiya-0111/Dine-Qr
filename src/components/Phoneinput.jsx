import { useState, useRef, useEffect } from "react";

// Common countries list — India first, then alphabetical
const COUNTRIES = [
  { code: "IN", dial: "+91", name: "India", flag: "🇮🇳" },
  { code: "US", dial: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dial: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AE", dial: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "SA", dial: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "AU", dial: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "BD", dial: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "CA", dial: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "CN", dial: "+86", name: "China", flag: "🇨🇳" },
  { code: "DE", dial: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "FR", dial: "+33", name: "France", flag: "🇫🇷" },
  { code: "ID", dial: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "IT", dial: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "JP", dial: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "KW", dial: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "MY", dial: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "NP", dial: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "NZ", dial: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "OM", dial: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "PK", dial: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "PH", dial: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "QA", dial: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "RU", dial: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "SG", dial: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "LK", dial: "+94", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "TH", dial: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "TR", dial: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "ZA", dial: "+27", name: "South Africa", flag: "🇿🇦" },
];

/**
 * PhoneInput — Country code dropdown + phone number input
 *
 * Props:
 *   value        {string}   — full value like "+91 9876543210"
 *   onChange     {fn}       — called with new full string
 *   placeholder  {string}
 *   className    {string}   — extra classes for the wrapper div
 *   label        {string}   — optional label text
 *   helperText   {string}   — optional helper text below
 */
export default function PhoneInput({
  value = "",
  onChange,
  placeholder = "Phone number",
  className = "",
  label,
  helperText,
}) {
  // Parse stored value → split into dialCode + number
  const parseValue = (val) => {
    const match = COUNTRIES.find((c) => val?.startsWith(c.dial + " ") || val === c.dial);
    if (match) {
      return {
        country: match,
        number: val.slice(match.dial.length).trim(),
      };
    }
    // default India
    return { country: COUNTRIES[0], number: val || "" };
  };

  const parsed = parseValue(value);
  const [selected, setSelected] = useState(parsed.country);
  const [number, setNumber] = useState(parsed.number);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Sync if parent value changes externally
  useEffect(() => {
    const p = parseValue(value);
    setSelected(p.country);
    setNumber(p.number);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const handleSelect = (country) => {
    setSelected(country);
    setOpen(false);
    setSearch("");
    const full = number ? `${country.dial} ${number}` : country.dial;
    onChange?.(full);
  };

  const handleNumberChange = (e) => {
    const raw = e.target.value.replace(/[^0-9\s\-]/g, ""); // digits, spaces, dashes only
    setNumber(raw);
    const full = raw ? `${selected.dial} ${raw}` : selected.dial;
    onChange?.(full);
  };

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}

      <div className="flex gap-0 border-2 border-gray-200 rounded-lg overflow-visible focus-within:border-[#8A244B] transition-all relative">
        {/* Country Code Button */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-3 bg-gray-50 hover:bg-gray-100 border-r border-gray-200 transition-colors h-full rounded-l-lg text-sm font-medium whitespace-nowrap"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-gray-700">{selected.dial}</span>
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl w-64 overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-gray-100">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#8A244B] transition"
                />
              </div>

              {/* List */}
              <ul className="max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-gray-400 text-center">
                    No country found
                  </li>
                ) : (
                  filtered.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => handleSelect(c)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-pink-50 transition-colors ${
                          selected.code === c.code
                            ? "bg-[#8A244B]/10 font-semibold text-[#8A244B]"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span className="flex-1 text-left truncate">{c.name}</span>
                        <span className="text-gray-400 font-mono text-xs">{c.dial}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Number Input */}
        <input
          type="tel"
          value={number}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-3 text-sm outline-none bg-transparent rounded-r-lg min-w-0"
        />
      </div>

      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
}