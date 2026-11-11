export type DeviceMeta = {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: 'ios' | 'android' | 'macos' | 'other';
  viewportWidth: number;
  browser: string;
  browserVersion: number | null;
};

// Order matters: most browsers also claim to be Chrome or Safari.
const BROWSERS: Array<[name: string, pattern: RegExp]> = [
  ['Edge', /edg(?:e|a|ios)?\/(\d+)/],
  ['Opera', /(?:opr|opios)\/(\d+)/],
  ['Samsung Internet', /samsungbrowser\/(\d+)/],
  ['Firefox', /(?:firefox|fxios)\/(\d+)/],
  ['Chrome', /(?:chrome|crios)\/(\d+)/],
  ['Safari', /version\/(\d+).*safari\//],
];

function parseBrowser(ua: string): Pick<DeviceMeta, 'browser' | 'browserVersion'> {
  for (const [browser, pattern] of BROWSERS) {
    const match = ua.match(pattern);
    if (match) return { browser, browserVersion: Number(match[1]) };
  }
  return { browser: 'other', browserVersion: null };
}

/**
 * `hasTouch` tells an iPad apart from a Mac: iPadOS Safari sends a desktop Mac user agent.
 * Only the browser's name and major version are kept, never the raw user agent.
 */
export function parseDeviceMeta(
  userAgent: string,
  viewportWidth: number,
  hasTouch = false,
): DeviceMeta {
  const ua = userAgent.toLowerCase();

  let deviceType: DeviceMeta['deviceType'] = 'desktop';
  if (viewportWidth < 768) deviceType = 'mobile';
  else if (viewportWidth < 1024) deviceType = 'tablet';

  let os: DeviceMeta['os'] = 'other';
  if (/iphone|ipad|ipod/.test(ua)) os = 'ios';
  else if (/android/.test(ua)) os = 'android';
  else if (/mac os|macintosh/.test(ua)) os = hasTouch ? 'ios' : 'macos';

  return { deviceType, os, viewportWidth, ...parseBrowser(ua) };
}
