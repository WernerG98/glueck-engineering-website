import { useEffect, useRef, useState } from "react";

export default function useInView(options) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options ?? { threshold: 0.15 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return [ref, inView];
}
