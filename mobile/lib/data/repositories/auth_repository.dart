import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/constants/api_constants.dart';
import '../../core/network/api_endpoints.dart';
import '../../core/network/dio_client.dart';
import '../models/user_model.dart';

/// Auth Repository Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthRepository(dioClient, storage);
});

/// Auth Repository for handling authentication API calls
class AuthRepository {
  final DioClient _dioClient;
  final FlutterSecureStorage _storage;

  AuthRepository(this._dioClient, this._storage);

  /// Login user
  Future<AuthResponse> login(LoginRequest request) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.login,
        data: request.toJson(),
      );

      final authResponse = AuthResponse.fromJson(response.data);

      // Store tokens
      await _saveTokens(authResponse);

      return authResponse;
    } catch (e) {
      rethrow;
    }
  }

  /// Register new user
  Future<AuthResponse> register(RegisterRequest request) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.register,
        data: request.toJson(),
      );

      final authResponse = AuthResponse.fromJson(response.data);

      // Store tokens
      await _saveTokens(authResponse);

      return authResponse;
    } catch (e) {
      rethrow;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      await _dioClient.post(ApiEndpoints.logout);
    } catch (e) {
      // Ignore logout errors, still clear local data
    } finally {
      await _clearTokens();
    }
  }

  /// Refresh access token
  Future<String?> refreshToken() async {
    try {
      final refreshToken =
          await _storage.read(key: ApiConstants.refreshTokenKey);
      if (refreshToken == null) return null;

      final response = await _dioClient.post(
        ApiEndpoints.refreshToken,
        data: {'refresh_token': refreshToken},
      );

      final newToken = response.data['access_token'];
      if (newToken != null) {
        await _storage.write(
          key: ApiConstants.accessTokenKey,
          value: newToken,
        );
        return newToken;
      }
      return null;
    } catch (e) {
      await _clearTokens();
      return null;
    }
  }

  /// Get current user profile
  Future<UserModel> getProfile() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.profile);
      return UserModel.fromJson(response.data['user'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Update user profile
  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _dioClient.put(
        ApiEndpoints.updateProfile,
        data: data,
      );
      return UserModel.fromJson(response.data['user'] ?? response.data);
    } catch (e) {
      rethrow;
    }
  }

  /// Change password
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _dioClient.post(
        ApiEndpoints.changePassword,
        data: {
          'current_password': currentPassword,
          'new_password': newPassword,
        },
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Forgot password - send reset email
  Future<void> forgotPassword(String email) async {
    try {
      await _dioClient.post(
        ApiEndpoints.forgotPassword,
        data: {'email': email},
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Reset password with token
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      await _dioClient.post(
        ApiEndpoints.resetPassword,
        data: {
          'token': token,
          'new_password': newPassword,
        },
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Verify email with token
  Future<void> verifyEmail(String token) async {
    try {
      await _dioClient.post(
        ApiEndpoints.verifyEmail,
        data: {'token': token},
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Resend verification email
  Future<void> resendVerification(String email) async {
    try {
      await _dioClient.post(
        ApiEndpoints.resendVerification,
        data: {'email': email},
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await _storage.read(key: ApiConstants.accessTokenKey);
    return token != null && token.isNotEmpty;
  }

  /// Get stored access token
  Future<String?> getAccessToken() async {
    return await _storage.read(key: ApiConstants.accessTokenKey);
  }

  /// Save tokens to secure storage
  Future<void> _saveTokens(AuthResponse authResponse) async {
    await _storage.write(
      key: ApiConstants.accessTokenKey,
      value: authResponse.accessToken,
    );
    if (authResponse.refreshToken != null) {
      await _storage.write(
        key: ApiConstants.refreshTokenKey,
        value: authResponse.refreshToken,
      );
    }
  }

  /// Clear all tokens from secure storage
  Future<void> _clearTokens() async {
    await _storage.delete(key: ApiConstants.accessTokenKey);
    await _storage.delete(key: ApiConstants.refreshTokenKey);
  }
}
