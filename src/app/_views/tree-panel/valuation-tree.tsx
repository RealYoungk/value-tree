"use client";

import { useState, useMemo } from "react";
import type { TreeNode as TreeNodeType } from "@/entities/session";
import { TreeNode } from "./tree-node";

export function ValuationTree({ tree }: { tree: TreeNodeType }) {
  // Default: root + level 1 expanded
  const initialExpanded = useMemo(() => {
    const set = new Set<string>();
    set.add(tree.id);
    if (tree.children) {
      for (const child of tree.children) {
        set.add(child.id);
      }
    }
    return set;
  }, [tree]);

  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  function handleToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-zinc-500">
        밸류에이션 트리
      </h3>
      <TreeNode
        node={tree}
        level={0}
        expanded={expanded}
        onToggle={handleToggle}
      />
    </div>
  );
}
