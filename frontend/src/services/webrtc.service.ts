import Peer, { Instance as SimplePeerInstance } from 'simple-peer';
import { io, Socket } from 'socket.io-client';

export interface WebRTCConfig {
  iceServers?: RTCIceServer[];
  enableDataChannel?: boolean;
}

export interface StreamInfo {
  peerId: string;
  stream: MediaStream;
  studentId?: string;
  studentName?: string;
  attemptId?: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

class WebRTCService {
  private socket: Socket | null = null;
  private peers: Map<string, SimplePeerInstance> = new Map();
  private localStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private connectionState: ConnectionState = 'disconnected';
  private token: string | null = null;
  private role: 'student' | 'proctor' = 'student';

  // Event callbacks
  private onStreamCallback: ((info: StreamInfo) => void) | null = null;
  private onStreamEndCallback: ((peerId: string) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: ConnectionState) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor() {
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
      enableDataChannel: false,
    };
  }

  // Configure the service
  configure(config: Partial<WebRTCConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
  }

  // Connect to signaling server
  async connect(role: 'student' | 'proctor', roomId?: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    this.role = role;
    this.setConnectionState('connecting');

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const baseUrl = import.meta.env.VITE_WS_URL || apiUrl.replace('/api', '');

    return new Promise((resolve, reject) => {
      this.socket = io(`${baseUrl}/webrtc`, {
        auth: { token: this.token },
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('WebRTC signaling connected');
        this.setConnectionState('connected');

        // Join room if specified
        if (roomId) {
          this.socket?.emit('joinRoom', { roomId, role });
        }

        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('WebRTC signaling disconnected');
        this.setConnectionState('disconnected');
        this.cleanupPeers();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebRTC signaling error:', error);
        this.setConnectionState('failed');
        this.onErrorCallback?.(error);
        reject(error);
      });

      // Handle signaling messages
      this.socket.on('signal', this.handleSignal.bind(this));
      this.socket.on('peerJoined', this.handlePeerJoined.bind(this));
      this.socket.on('peerLeft', this.handlePeerLeft.bind(this));
      this.socket.on('offer', this.handleOffer.bind(this));
      this.socket.on('answer', this.handleAnswer.bind(this));
      this.socket.on('iceCandidate', this.handleIceCandidate.bind(this));
    });
  }

  // Disconnect from signaling server
  disconnect() {
    this.cleanupPeers();
    this.socket?.disconnect();
    this.socket = null;
    this.setConnectionState('disconnected');
  }

  // Start streaming local media
  async startStreaming(stream: MediaStream): Promise<void> {
    this.localStream = stream;

    // If we're a student, we initiate connections to proctors
    if (this.role === 'student') {
      this.socket?.emit('studentReady', { hasStream: true });
    }
  }

  // Stop streaming
  stopStreaming() {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.cleanupPeers();
  }

  // Request stream from a specific student (proctor only)
  requestStream(studentId: string, attemptId: string) {
    if (this.role !== 'proctor') {
      console.warn('Only proctors can request streams');
      return;
    }

    this.socket?.emit('requestStream', { studentId, attemptId });
  }

  // Stop receiving stream from a student
  stopReceivingStream(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.destroy();
      this.peers.delete(peerId);
      this.onStreamEndCallback?.(peerId);
    }
  }

  // Handle incoming signal
  private handleSignal(data: { peerId: string; signal: Peer.SignalData }) {
    const peer = this.peers.get(data.peerId);
    if (peer) {
      peer.signal(data.signal);
    }
  }

  // Handle peer joined (proctor sees student join)
  private handlePeerJoined(data: { peerId: string; studentId?: string; studentName?: string; attemptId?: string }) {
    console.log('Peer joined:', data);

    if (this.role === 'proctor' && data.studentId) {
      // Create peer connection to receive stream
      this.createPeer(data.peerId, false, data);
    }
  }

  // Handle peer left
  private handlePeerLeft(data: { peerId: string }) {
    console.log('Peer left:', data);
    this.stopReceivingStream(data.peerId);
  }

  // Handle incoming offer (student receives from proctor)
  private handleOffer(data: { peerId: string; offer: RTCSessionDescriptionInit }) {
    console.log('Received offer from:', data.peerId);

    // Create answering peer
    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream: this.localStream || undefined,
      config: {
        iceServers: this.config.iceServers,
      },
    });

    this.setupPeerEvents(peer, data.peerId);
    this.peers.set(data.peerId, peer);

    // Signal the offer
    peer.signal({ type: 'offer', sdp: data.offer.sdp } as Peer.SignalData);
  }

  // Handle incoming answer
  private handleAnswer(data: { peerId: string; answer: RTCSessionDescriptionInit }) {
    console.log('Received answer from:', data.peerId);
    const peer = this.peers.get(data.peerId);
    if (peer) {
      peer.signal({ type: 'answer', sdp: data.answer.sdp } as Peer.SignalData);
    }
  }

  // Handle incoming ICE candidate
  private handleIceCandidate(data: { peerId: string; candidate: RTCIceCandidateInit }) {
    const peer = this.peers.get(data.peerId);
    if (peer) {
      peer.signal({ type: 'candidate', candidate: data.candidate } as unknown as Peer.SignalData);
    }
  }

  // Create a new peer connection
  private createPeer(
    peerId: string,
    initiator: boolean,
    metadata?: { studentId?: string; studentName?: string; attemptId?: string }
  ): SimplePeerInstance {
    const peer = new Peer({
      initiator,
      trickle: true,
      stream: initiator ? this.localStream || undefined : undefined,
      config: {
        iceServers: this.config.iceServers,
      },
    });

    this.setupPeerEvents(peer, peerId, metadata);
    this.peers.set(peerId, peer);

    return peer;
  }

  // Setup peer event handlers
  private setupPeerEvents(
    peer: SimplePeerInstance,
    peerId: string,
    metadata?: { studentId?: string; studentName?: string; attemptId?: string }
  ) {
    peer.on('signal', (signal) => {
      // Send signal through signaling server
      this.socket?.emit('signal', { peerId, signal });
    });

    peer.on('stream', (stream) => {
      console.log('Received stream from peer:', peerId);
      this.onStreamCallback?.({
        peerId,
        stream,
        studentId: metadata?.studentId,
        studentName: metadata?.studentName,
        attemptId: metadata?.attemptId,
      });
    });

    peer.on('connect', () => {
      console.log('Peer connected:', peerId);
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', peerId);
      this.peers.delete(peerId);
      this.onStreamEndCallback?.(peerId);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', peerId, err);
      this.onErrorCallback?.(err);
      this.peers.delete(peerId);
      this.onStreamEndCallback?.(peerId);
    });
  }

  // Cleanup all peer connections
  private cleanupPeers() {
    this.peers.forEach((peer, peerId) => {
      peer.destroy();
      this.onStreamEndCallback?.(peerId);
    });
    this.peers.clear();
  }

  // Set connection state
  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    this.onConnectionStateChangeCallback?.(state);
  }

  // Event handlers
  onStream(callback: (info: StreamInfo) => void) {
    this.onStreamCallback = callback;
  }

  onStreamEnd(callback: (peerId: string) => void) {
    this.onStreamEndCallback = callback;
  }

  onConnectionStateChange(callback: (state: ConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  onError(callback: (error: Error) => void) {
    this.onErrorCallback = callback;
  }

  // Getters
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  getPeerCount(): number {
    return this.peers.size;
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;
