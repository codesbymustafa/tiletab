import { useState, FormEvent, ChangeEvent, JSX, useRef, useEffect } from "react";
import { FiSearch } from "react-icons/fi"; // icon import

type Theme = "light" | "dark";

interface GoogleSearchBarProps {
  theme?: Theme;
}

export default function GoogleSearchBar({ theme = 'dark' }: GoogleSearchBarProps): JSX.Element {
  const [query, setQuery] = useState<string>("");
  const containerRef = useRef<HTMLFormElement>(null);
  const [scaleHeight, setScaleHeight] = useState(1);
  const [scaleWidth, setScaleWidth] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Separate scales for width and height
        const newScaleHeight = Math.max(0.5, Math.min(2, height / 150));
        const newScaleWidth = Math.max(0.5, Math.min(2, width / 400));
        setScaleHeight(newScaleHeight);
        setScaleWidth(newScaleWidth);
      }
    };

    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    const encoded = encodeURIComponent(query.trim());
    window.location.href = `https://www.google.com/search?q=${encoded}`;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const themes = {
    light: {
      wrapper: "bg-white",
      bar: "bg-gray-100 border border-gray-300",
      text: "text-gray-900",
      icon: "text-gray-600 hover:text-gray-800",
    },
    dark: {
      wrapper: "bg-gray-900",
      bar: "bg-gray-800 border border-gray-600",
      text: "text-gray-100",
      icon: "text-gray-400 hover:text-gray-200",
    },
  };

  const active = themes[theme];

  // Combined scale uses min for text/icons, width scale affects horizontal padding
  const scale = Math.min(scaleHeight, scaleWidth);
  
  // Responsive sizes based on scales
  const fontSize = `${Math.max(10, 16 * scale)}px`;
  const iconSize = Math.max(14, 20 * scale);
  const paddingX = `${Math.max(8, 16 * scaleWidth)}px`;
  const paddingY = `${Math.max(4, 12 * scaleHeight)}px`;
  const borderRadius = `${Math.max(12, 24 * scale)}px`;

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className={`${active.wrapper} h-full w-full flex items-center justify-center p-[5%]`}
    >
      <div
        className={`flex items-center w-full ${active.bar}`}
        style={{
          paddingLeft: paddingX,
          paddingRight: paddingX,
          paddingTop: paddingY,
          paddingBottom: paddingY,
          borderRadius: borderRadius,
        }}
      >
        <input
          type="text"
          placeholder="Search Google..."
          value={query}
          onChange={handleChange}
          className={`flex-1 bg-transparent outline-none ${active.text}`}
          style={{ fontSize }}
        />

        <button
          type="submit"
          className={`transition ${active.icon}`}
          style={{ padding: `${Math.max(2, 4 * scale)}px` }}
          aria-label="Search"
        >
          <FiSearch size={iconSize} />
        </button>
      </div>
    </form>
  );
}
