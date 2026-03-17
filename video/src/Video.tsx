import React from "react";
import { fontStyleTag } from "./design/fonts";
import { PromoV2 } from "./scenes/PromoV2";

/**
 * Top-level video component. Loads fonts and renders the promo.
 */
export const PromoVideo: React.FC = () => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fontStyleTag() }} />
      <PromoV2 />
    </>
  );
};
