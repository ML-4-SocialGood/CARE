/** @format */

export default function getSiteUrl() {
  if (import.meta.env.MODE === "production") {
    return "";
  } else {
    return "";
  }
}
