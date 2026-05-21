export type DeviceMeta = {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: 'ios' | 'android' | 'other';
  viewportWidth: number;
};

export function parseDeviceMeta(userAgent: string, viewportWidth: number): DeviceMeta {
  const ua = userAgent.toLowerCase();

  let deviceType: DeviceMeta['deviceType'] = 'desktop';
  if (viewportWidth < 768) deviceType = 'mobile';
  else if (viewportWidth < 1024) deviceType = 'tablet';

  let os: DeviceMeta['os'] = 'other';
  if (/iphone|ipad|ipod|mac os|macintosh/.test(ua)) os = 'ios';
  else if (/android/.test(ua)) os = 'android';

  return { deviceType, os, viewportWidth };
}
