import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store the connection with null checking
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.add(client.id);
      }

      // Join the user to their room
      client.join(`user-${userId}`);

      console.log(`User ${userId} connected`);
    } catch (e) {
      console.error('WebSocket connection error:', e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove the socket from our map
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { token: string }) {
    try {
      const decodedToken = this.jwtService.verify(payload.token);
      const userId = decodedToken.sub;

      // Join the user to their room if not already
      client.join(`user-${userId}`);

      return { status: 'subscribed' };
    } catch (e) {
      return { status: 'error', message: 'Invalid token' };
    }
  }

  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user-${userId}`).emit('notification', notification);
  }

  broadcastSystemNotification(message: string) {
    this.server.emit('system', { message });
  }
}
