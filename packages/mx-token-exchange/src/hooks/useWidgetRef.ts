import { useCallback, useState } from "react";

export const useWidgetRef = <ElementType extends HTMLElement>() => {
    const [element, setElement] = useState<ElementType | undefined>();
    const ref = useCallback<(element: ElementType | undefined) => void>((element) => setElement(element), []);
    return { element, ref };
};
