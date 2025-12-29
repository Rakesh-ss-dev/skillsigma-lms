import { useState, useRef, useEffect, useMemo } from "react";

interface Option {
  value: string;
  text: string;
  selected?: boolean; // ✅ NEW: support selected flag
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxSelected?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected,
  onChange,
  disabled = false,
  placeholder = "Select option",
  maxSelected,
}) => {
  // ✅ Compute initial selection from defaultSelected or selected: true in options
  const initialSelection =
    defaultSelected ??
    options.filter((opt) => opt.selected).map((opt) => opt.value);

  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialSelection);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  // ✅ Handle select/deselect
  const handleSelect = (optionValue: string) => {
    const isAlreadySelected = selectedOptions.includes(optionValue);

    if (!isAlreadySelected && maxSelected && selectedOptions.length >= maxSelected) return;

    const newSelectedOptions = isAlreadySelected
      ? selectedOptions.filter((value) => value !== optionValue)
      : [...selectedOptions, optionValue];

    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  // ✅ Remove single option
  const removeOption = (value: string) => {
    const newSelectedOptions = selectedOptions.filter((opt) => opt !== value);
    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  // ✅ Keep state in sync if options or defaultSelected change
  useEffect(() => {
    const newDefault =
      defaultSelected ??
      options.filter((opt) => opt.selected).map((opt) => opt.value);

    if (
      newDefault.length !== selectedOptions.length ||
      !newDefault.every((val) => selectedOptions.includes(val))
    ) {
      setSelectedOptions(newDefault);
    }
  }, [defaultSelected, options]);

  // ✅ Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Close on ESC and allow ArrowDown to open
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key === "ArrowDown") setIsOpen(true);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ✅ Memoized selected texts for performance
  const selectedValuesText = useMemo(
    () =>
      selectedOptions.map(
        (value) => options.find((option) => option.value === value)?.text || ""
      ),
    [selectedOptions, options]
  );

  return (
    <div className="w-full" ref={containerRef}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>

      <div className="relative z-20 inline-block w-full">
        {/* Input box */}
        <div
          role="button"
          tabIndex={0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={toggleDropdown}
          className={`mb-2 flex h-20 items-center rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 ${disabled
            ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800"
            : "cursor-pointer"
            }`}
        >
          <div className="flex flex-wrap flex-auto gap-2">
            {selectedValuesText.length > 0 ? (
              selectedValuesText.map((text, index) => (
                <div
                  key={index}
                  className="group flex items-center rounded-full border border-gray-200 bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 dark:bg-gray-800 dark:text-white/90"
                >
                  <span>{text}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(selectedOptions[index]);
                      }}
                      className="ml-2 text-gray-500 hover:text-gray-400 dark:text-gray-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                {placeholder}
              </span>
            )}
          </div>

          <svg
            className={`ml-auto h-5 w-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""
              }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 20 20"
          >
            <path d="M6 8l4 4 4-4" />
          </svg>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <ul
            className="absolute left-0 bg-white dark:bg-gray-900 top-full z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900"
            role="listbox"
          >
            {options.map((option) => (
              <li
                key={option.value}
                role="option"
                aria-selected={selectedOptions.includes(option.value)}
                onClick={() => handleSelect(option.value)}
                className={`cursor-pointer px-3 py-2 hover:bg-primary/10 ${selectedOptions.includes(option.value)
                  ? "bg-primary/5 font-medium"
                  : ""
                  }`}
              >
                {option.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
