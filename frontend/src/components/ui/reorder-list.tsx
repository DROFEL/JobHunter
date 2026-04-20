"use client";
import React from "react";
import { Grip } from "lucide-react";
import { Reorder, useDragControls, useMotionValue } from "motion/react";

import { useRaisedShadow } from "@/hooks/useRaisedShadow.ts";
import { cn } from "@/lib/utils.ts";

type Key = string | number;

interface ReorderListProps<T> {
  items: T[];
  getValue: (item: T) => Key;
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  withDragHandle?: boolean;
}

export function ReorderList<T>({
  items,
  getValue,
  onReorder,
  renderItem,
  className,
  itemClassName,
  withDragHandle = false,
}: ReorderListProps<T>) {
  return (
    <Reorder.Group
      as="div"
      axis="y"
      values={items}
      onReorder={onReorder}
      className={cn("flex flex-col gap-1 select-none", className)}
    >
      {items.map((item, index) => (
        <ReorderListItem
          key={getValue(item)}
          item={item}
          value={item}
          className={itemClassName}
          withDragHandle={withDragHandle}
        >
          {renderItem(item, index)}
        </ReorderListItem>
      ))}
    </Reorder.Group>
  );
}

function ReorderListItem<T>({
  item,
  value,
  className,
  withDragHandle = false,
  children,
}: {
  item: T;
  value: T;
  className?: string;
  withDragHandle?: boolean;
  children: React.ReactNode;
}) {
  const y = useMotionValue(0);
  const boxShadow = useRaisedShadow(y);
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="div"
      value={value}
      className={cn(
        "relative list-none",
        !withDragHandle && "cursor-grab",
        className,
      )}
      style={{ y, boxShadow, position: "relative" }}
      dragListener={!withDragHandle}
      dragControls={withDragHandle ? dragControls : undefined}
    >
      {children}
      {withDragHandle ? (
        <Grip
          className="size-6 absolute cursor-grab right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          onPointerDown={(e) => dragControls.start(e)}
        />
      ) : null}
    </Reorder.Item>
  );
}