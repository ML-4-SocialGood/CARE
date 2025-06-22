/** @format */

import "./imagebanner.css";
import heroFallback from "@renderer/assets/hero_fallback.jpg"

export const ImageBanner = () => {
  return (

      <div className="imagebanner">
        <img
          alt="Trees"
          className="imagebanner_image"
          src={heroFallback}
        />
      </div>

  );
};