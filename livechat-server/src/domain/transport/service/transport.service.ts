import { Router, WebRtcTransport } from "mediasoup/node/lib/types";
import { TransportOptions } from "../../room/types/room.types";
import { mediasoupConfig } from "../../../config/mediasoup.config";
import { logger } from "../../../utils/logger";

class TransportService {
  // mediasoup 라우터에 WebRtcTransport를 생성
  async createWebRtcTransport(router: Router): Promise<{
    transport: WebRtcTransport;
    params: TransportOptions;
  }> {
    const transport = await router.createWebRtcTransport(
      mediasoupConfig.webRtcTransport
    );

    const params: TransportOptions = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };

    logger.info(`WebRTC transport created: ${transport.id}`);
    return { transport, params };
  }
}

export const transportService = new TransportService();
