/** @format */
function getQueryParamValue(url, paramName) {
  const params = new URLSearchParams(new URL(url).search);
  return params.get(paramName);
}

export function isPresignedUrlExpired(preSignedURL) {
  const xGoogExpires = getQueryParamValue(preSignedURL, "X-Goog-Expires");
  const xGoogDate = getQueryParamValue(preSignedURL, "X-Goog-Date");

  // If for some reason we can't extract the necessary parameters, just return false and refetch
  if (xGoogExpires === null || xGoogDate === null) {
    return true;
  }

  // Extract year, month, day, hour, minute, and second from the string
  const year = xGoogDate.slice(0, 4);
  const month = xGoogDate.slice(4, 6);
  const day = xGoogDate.slice(6, 8);
  const hour = xGoogDate.slice(9, 11);
  const minute = xGoogDate.slice(11, 13);
  const second = xGoogDate.slice(13, 15);

  // Create a new date string in the format recognized by Date object
  const dateFormatted = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;

  // Create a Date object from the formatted string
  const date = new Date(dateFormatted);

  const expirationDurationSeconds = parseInt(xGoogExpires);

  const expirationDate = date.setSeconds(
    date.getSeconds() + expirationDurationSeconds
  );

  return Date.now() > expirationDate;
}
