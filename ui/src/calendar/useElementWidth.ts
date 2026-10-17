import { useLayoutEffect, useRef, useState } from "react";
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    const style = getComputedStyle(element);
    setWidth(
      element.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
