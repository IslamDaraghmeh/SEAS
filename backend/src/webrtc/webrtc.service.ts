import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface PeerConnection {
  peerId: string;
  attemptId: string;
  examId: string;
  userId: string;
  userRole: string;
  connectedAt: Date;
}

@Injectable()
export class WebRTCService {
  private peers: Map<string, PeerConnection> = new Map();
  private streams: Map<string, Set<string>> = new Map(); // attemptId -> Set of proctor peerIds watching

  constructor(private configService: ConfigService) {}

  getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [];

    // Add STUN server
    const stunUrl = this.configService.get<string>(
      'WEBRTC_STUN_URL',
      'stun:stun.l.google.com:19302',
    );
    servers.push({ urls: stunUrl });

    // Add TURN server if configured
    const turnUrl = this.configService.get<string>('WEBRTC_TURN_URL');
    const turnUsername = this.configService.get<string>('WEBRTC_TURN_USERNAME');
    const turnCredential = this.configService.get<string>('WEBRTC_TURN_CREDENTIAL');

    if (turnUrl && turnUsername && turnCredential) {
      servers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    return servers;
  }

  registerPeer(
    peerId: string,
    attemptId: string,
    examId: string,
    userId: string,
    userRole: string,
  ): void {
    this.peers.set(peerId, {
      peerId,
      attemptId,
      examId,
      userId,
      userRole,
      connectedAt: new Date(),
    });

    console.log(`WebRTC peer registered: ${peerId} for attempt ${attemptId}`);
  }

  unregisterPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      // Remove from streams
      this.streams.forEach((proctors, attemptId) => {
        proctors.delete(peerId);
      });
      this.peers.delete(peerId);
      console.log(`WebRTC peer unregistered: ${peerId}`);
    }
  }

  getPeer(peerId: string): PeerConnection | undefined {
    return this.peers.get(peerId);
  }

  getStudentPeerForAttempt(attemptId: string): PeerConnection | undefined {
    for (const peer of this.peers.values()) {
      if (peer.attemptId === attemptId && peer.userRole === 'STUDENT') {
        return peer;
      }
    }
    return undefined;
  }

  getProctorsWatchingAttempt(attemptId: string): PeerConnection[] {
    const proctorPeerIds = this.streams.get(attemptId);
    if (!proctorPeerIds) return [];

    return Array.from(proctorPeerIds)
      .map((peerId) => this.peers.get(peerId))
      .filter((peer): peer is PeerConnection => peer !== undefined);
  }

  startWatching(proctorPeerId: string, attemptId: string): void {
    if (!this.streams.has(attemptId)) {
      this.streams.set(attemptId, new Set());
    }
    this.streams.get(attemptId)!.add(proctorPeerId);
    console.log(`Proctor ${proctorPeerId} started watching attempt ${attemptId}`);
  }

  stopWatching(proctorPeerId: string, attemptId: string): void {
    const proctors = this.streams.get(attemptId);
    if (proctors) {
      proctors.delete(proctorPeerId);
      if (proctors.size === 0) {
        this.streams.delete(attemptId);
      }
    }
    console.log(`Proctor ${proctorPeerId} stopped watching attempt ${attemptId}`);
  }

  getActiveStreams(): Array<{
    attemptId: string;
    studentPeerId: string | undefined;
    proctorCount: number;
  }> {
    const result = [];
    for (const [attemptId, proctors] of this.streams.entries()) {
      const studentPeer = this.getStudentPeerForAttempt(attemptId);
      result.push({
        attemptId,
        studentPeerId: studentPeer?.peerId,
        proctorCount: proctors.size,
      });
    }
    return result;
  }
}
