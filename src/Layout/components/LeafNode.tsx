import React, { memo, CSSProperties } from "react";
import { LeafNode as LeafNodeType } from "@/types";
import { FLEXBIT_REGISTRY } from "@/stores/flexbitRegistry";

export interface LeafNodeProps {
    node: LeafNodeType;
    style: CSSProperties;
    padding: number;
}

const LeafNode = memo(({ node, style, padding }: LeafNodeProps) => {
    return (
        <div
            key={node.id}
            className="bg-gray-900 flex items-center justify-center text-white font-mono text-sm overflow-hidden"
            style={{ ...style, padding: `${padding}px` }}
        >
            <div className="flex flex-col p-0 border border-gray-700 rounded-2xl h-full w-full overflow-hidden">
                
                <div className="bg-gray-800 w-full text-center h-7 flex-shrink-0 flex items-center justify-center border-b border-gray-700">

                    <span className="text-blue-400 font-semibold">
                        {node.component_connected || node.id}
                    </span>

                </div>

                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0">
                        {node.component_connected && FLEXBIT_REGISTRY[node.component_connected] ? (
                            React.createElement(FLEXBIT_REGISTRY[node.component_connected].component)
                        ) : (
                            <div className="flex items-center justify-center h-full w-full text-xs text-gray-400">
                                No component connected
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
});

export default LeafNode;
