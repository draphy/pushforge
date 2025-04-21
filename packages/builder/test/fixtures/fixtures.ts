import type { PushMessage, PushSubscription } from '../../lib/types.js';

export const subscriptions = {
  chrome: {
    endpoint:
      'https://fcm.googleapis.com/fcm/send/ekhJ4l8bTqw:APA91bGyU0XqT5uWpyGzpx9TDtGc0m-CTPpjnnOVnl_ybIOlue7LPYlHoRyWZ4JgySwceHjmvDprQMW9vehEZn5ifluMA0Bq2FA5qfYceC3vv5YivFFtA2debLNbpfiLEN73WyoVJfgG',
    keys: {
      p256dh:
        'BGPknDTtnF3sW5XPDzZl9DD2YqFY0WsyqZJ2Pxrzq8x1HY-5aF2aRiCz_QKDY2nj-ZFtqdBwRsV9yoPRg_015Vo',
      auth: 'ynfeyAwBSXODSCaeRNQZiw',
    },
  },
  edge: {
    endpoint:
      'https://wns2-sg2p.notify.windows.com/w/?token=BQYAAAALwNoB%2fBFE0R6H%2bayc5WRfMVkJlB3mHXSmsCTKWeZZM%2faOvneI8DaE%2fQeCC6uE17dj%2bPNz9drmi5bEvrNRTs8hzCS2abTpc4lfS9XbebI8lqe%2bXcPerho8q5SnWcTk4GURFakuZUYI6e0xMnTG%2bpvFxFatlhq4CELEEyo9%2fAP%2fHMx8tPCSXsh3sSFDtx6MkDnMHmR%2fUvcCrnLbXCDiseZ40bQI6a5tRmOM0izm0Gfc%2foKWmce8JUk2TRtm%2fecPR1F0X%2bVj4JQsDAR7Kx56HUCONLNMzuVm%2b9O6Yp1bLUfnp1QJyVOVyyj6DQfG%2bOOsikh%2bd2foJpWHggpFenW3NiT3',
    keys: {
      p256dh:
        'BDPQRxcMhoXtPqJvQ9Kp-FGsQexasWXvh0RTE15Y0qbxKLFZ6eG3U90RJQFkb_SdAB_YzbIm7hcvzn1yAzNZbxs',
      auth: 'XGCMxdgIGIp7SNs3kb4x7g',
    },
  },
} satisfies Record<string, PushSubscription>;

export const message = {
  payload: { title: 'Test push', body: 'This is a test web push' },
  adminContact: 'mailto:test@test.test',
  options: {
    ttl: 60,
    topic: 'from-test-env',
    urgency: 'high',
  },
} satisfies PushMessage;
