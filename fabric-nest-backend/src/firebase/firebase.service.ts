import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private readonly CREDENTIALS_COLLECTION = 'user_credentials';

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  /**
   * Firebase Admin SDK 초기화
   */
  private initializeFirebase() {
    try {
      // Firebase가 이미 초기화되었는지 확인
      if (admin.apps.length === 0) {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const databaseURL = this.configService.get<string>('FIREBASE_DATABASE_URL');
        
        // 필수 환경 변수가 모두 있는지 확인
        if (!projectId || !clientEmail || !privateKey) {
          this.logger.warn('Firebase 필수 환경 변수가 설정되지 않았습니다: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
          this.logger.warn('Firebase 기능이 비활성화됩니다.');
          return;
        }
        
        const serviceAccount = {
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        };
  
        const appConfig: admin.AppOptions = {
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        };
        
        if (databaseURL) {
          appConfig.databaseURL = databaseURL;
        }
  
        admin.initializeApp(appConfig);
        this.logger.log('Firebase Admin SDK가 성공적으로 초기화되었습니다');
      }
    } catch (error) {
      this.logger.error(`Firebase 초기화 실패: ${error}`);
      throw new Error('파이어베이스 초기화 실패')
      // throw error;
    }
  }

  /**
   * 사용자 인증 정보를 Firebase에 저장
   */
  async storeUserCredentials(userId: string, credentials: any): Promise<void> {
    try {
      // Firebase Firestore에 인증 정보 저장
      await admin.firestore()
        .collection(this.CREDENTIALS_COLLECTION)
        .doc(userId)
        .set({
          userId,
          credentials,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      this.logger.log(`사용자 ${userId}의 인증 정보가 Firebase에 저장되었습니다`);
    } catch (error) {
      this.logger.error(`사용자 인증 정보 저장 실패: ${error}`);
      throw error;
    }
  }

  /**
   * Firebase에서 사용자 인증 정보 조회
   */
async getUserCredentials(userId: string): Promise<any> {
  try {
    const doc = await admin.firestore()
      .collection(this.CREDENTIALS_COLLECTION)
      .doc(userId)
      .get();

    if (!doc.exists) {
      throw new Error(`사용자 ${userId}의 인증 정보를 Firebase에서 찾을 수 없습니다`);
    }

    const data = doc.data();
    if (!data) {
      throw new Error(`사용자 ${userId}의 문서가 존재하지만 데이터가 없습니다`);
    }

    return data.credentials;
  } catch (error) {
    this.logger.error(`사용자 인증 정보 조회 실패: ${error}`);
    throw error;
  }
}

  /**
   * Firebase에 사용자 인증 정보가 존재하는지 확인
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const doc = await admin.firestore()
        .collection(this.CREDENTIALS_COLLECTION)
        .doc(userId)
        .get();

      return doc.exists;
    } catch (error) {
      this.logger.error(`사용자 존재 여부 확인 실패: ${error}`);
      throw error;
    }
  }

  /**
   * Firebase에서 사용자 인증 정보 업데이트
   */
  async updateUserCredentials(userId: string, credentials: any): Promise<void> {
    try {
      await admin.firestore()
        .collection(this.CREDENTIALS_COLLECTION)
        .doc(userId)
        .update({
          credentials,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      this.logger.log(`사용자 ${userId}의 인증 정보가 Firebase에서 업데이트되었습니다`);
    } catch (error) {
      this.logger.error(`사용자 인증 정보 업데이트 실패: ${error}`);
      throw error;
    }
  }

  /**
   * Firebase에서 사용자 인증 정보 삭제
   */
  async deleteUserCredentials(userId: string): Promise<void> {
    try {
      await admin.firestore()
        .collection(this.CREDENTIALS_COLLECTION)
        .doc(userId)
        .delete();

      this.logger.log(`사용자 ${userId}의 인증 정보가 Firebase에서 삭제되었습니다`);
    } catch (error) {
      this.logger.error(`사용자 인증 정보 삭제 실패: ${error}`);
      throw error;
    }
  }

  /**
   * 추가 사용자 정보를 Firebase에 저장
   */
  async storeUserInfo(userId: string, userInfo: any): Promise<void> {
    try {
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .set({
          ...userInfo,
          userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      this.logger.log(`사용자 ${userId}의 정보가 Firebase에 저장되었습니다`);
    } catch (error) {
      this.logger.error(`사용자 정보 저장 실패: ${error}`);
      throw error;
    }
  }

  /**
   * Firebase에서 사용자 정보 조회
   */
  async getUserInfo(userId: string): Promise<any> {
    try {
      const doc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!doc.exists) {
        throw new Error(`사용자 ${userId}의 정보를 Firebase에서 찾을 수 없습니다`);
      }

      return doc.data();
    } catch (error) {
      this.logger.error(`사용자 정보 조회 실패: ${error}`);
      throw error;
    }
  }

  /**
   * Firebase 연결 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Firestore 간단한 쿼리 실행하여 연결 확인
      await admin.firestore().collection('health_check').doc('ping').set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      this.logger.log('Firebase 연결 상태: 정상');
      return true;
    } catch (error) {
      this.logger.error(`Firebase 연결 상태 확인 실패: ${error}`);
      return false;
    }
  }
}