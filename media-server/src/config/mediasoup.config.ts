import { RtpCodecCapability } from "mediasoup/node/lib/rtpParametersTypes";

export const mediasoupConfig = {
  worker: {
    logLevel: "warn" as const,
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  },
  webRtcTransport: {
    listenIps: [{ ip: "0.0.0.0", announcedIp: "127.0.0.1" }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  },
  mediaCodecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
      parameters: {
        "x-google-start-bitrate": 1000,
      },
    },
    {
      kind: "video",
      mimeType: "video/VP9",
      clockRate: 90000,
      parameters: {
        "profile-id": 2,
        "x-google-start-bitrate": 1000,
      },
    },
    {
      kind: "video",
      mimeType: "video/h264",
      clockRate: 90000,
      parameters: {
        "packetization-mode": 1,
        "profile-level-id": "4d0032",
        "level-asymmetry-allowed": 1,
        "x-google-start-bitrate": 1000,
      },
    },
  ] as RtpCodecCapability[],
};
