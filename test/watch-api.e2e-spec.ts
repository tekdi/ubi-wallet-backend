import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Watch API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/wallet/vcs/watch (POST)', () => {
    it('should register VC watch successfully', () => {
      return request(app.getHttpServer())
        .post('/api/wallet/vcs/watch')
        .set('Authorization', 'Bearer test-token')
        .send({
          vcPublicId: 'test-vc-123',
          email: 'test@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.message).toContain('VC watch registered successfully');
          expect(res.body.data).toBeDefined();
          expect(res.body.data.watchId).toBeDefined();
          expect(res.body.data.status).toBe('success');
        });
    });

    it('should return 400 if watch functionality not supported', () => {
      return request(app.getHttpServer())
        .post('/api/wallet/vcs/watch')
        .set('Authorization', 'Bearer test-token')
        .send({
          vcPublicId: 'test-vc-123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('Watch functionality not supported');
        });
    });

    it('should return 401 without authorization header', () => {
      return request(app.getHttpServer())
        .post('/api/wallet/vcs/watch')
        .send({
          vcPublicId: 'test-vc-123',
        })
        .expect(401);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/wallet/vcs/watch')
        .set('Authorization', 'Bearer test-token')
        .send({})
        .expect(400);
    });
  });

  describe('/api/wallet/vcs/watch/callback (POST)', () => {
    it('should process watch callback', () => {
      return request(app.getHttpServer())
        .post('/api/wallet/vcs/watch/callback')
        .send({
          identifier: 'test-did',
          recordPublicId: 'test-vc-123',
          messageId: 'test-message-123',
          data: { test: 'data' },
          timestamp: new Date().toISOString(),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.statusCode).toBe(200);
          expect(res.body.message).toContain('Watch callback processed successfully');
          expect(res.body.data).toBeDefined();
          expect(res.body.data.processed).toBe(true);
          expect(res.body.data.user_id).toBe('test-user');
          expect(res.body.data.recordPublicId).toBe('test-vc-123');
        });
    });
  });
}); 