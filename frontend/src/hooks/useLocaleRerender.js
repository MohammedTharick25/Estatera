import { useEffect, useReducer } from "react";
import { useLingui } from "@lingui/react";

export default function useLocaleRerender() {
  const { i18n } = useLingui();
  const [, forceRender] = useReducer((version) => version + 1, 0);

  useEffect(() => {
    const handleLocaleChange = () => forceRender();
    const unsubscribe = i18n.on("change", handleLocaleChange);
    return unsubscribe;
  }, [i18n]);
}
