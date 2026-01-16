import React, { useState, useRef, useCallback, JSX } from "react";
import SideBarContent from "./SideBarContent";

const SideBar = () : JSX.Element  => {
    const [isVisible, setIsVisible] = useState(false);
    const [width, setWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const startResizing = useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = window.innerWidth - mouseMoveEvent.clientX;
                if (newWidth < 250) {
                    setIsVisible(false);
                    return;
                }
                if (newWidth <= 600) {
                    setWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    React.useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const toggleSidebar = () => {
        setIsVisible(!isVisible);
    };
    //shortcut to toggle sidebar visibility

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "a" && event.ctrlKey) {
                event.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    });

    return (
        <>
            {/* Toggle Button */}
            <button
                className={`fixed top-1/2 -translate-y-1/2 z-[1001] w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center text-lg shadow-lg transition-all duration-300 hover:scale-110 ${
                    isVisible ? "bg-gray-600" : "bg-gray-700"
                }`}
                onClick={toggleSidebar}
                style={{
                    right: isVisible ? `${width}px` : "10px",
                }}
            >
                {isVisible ? "→" : "←"}
            </button>

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`fixed top-0 right-0 h-screen bg-gray-900 border-l border-gray-700 shadow-2xl z-[1000] flex select-none transition-transform duration-300 ease-in-out ${
                    isVisible ? "translate-x-0" : "translate-x-full"
                }`}
                style={{ width: `${width}px` }}
            >
                {/* Resize Handle */}
                <div
                    className="w-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 cursor-ew-resize transition-colors duration-200 flex-shrink-0"
                    onMouseDown={startResizing}
                />

                {/* Sidebar Content */}
                <div className="flex-1 flex flex-col text-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                        <h3 className="text-xl font-semibold text-white m-0">
                            Sidebar
                        </h3>
                        <button
                            className="bg-transparent border-none text-gray-400 text-2xl cursor-pointer p-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 hover:text-white transition-colors duration-200"
                            onClick={toggleSidebar}
                        >
                            ×
                        </button>
                    </div>

                    {/* Body */}
                    <SideBarContent />
                </div>
            </div>
        </>
    );
};

export default SideBar;
