/* eslint-disable no-prototype-builtins */
/* eslint-disable no-restricted-syntax */
export default function objectToQueryString(obj: {
  [key: string]: string | number | boolean;
}): string {
  const params = new URLSearchParams();

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (obj[key]) params.append(key, obj[key]?.toString());
    }
  }

  return `?${params.toString().replace(/\+/g, "%20")}`;
}
