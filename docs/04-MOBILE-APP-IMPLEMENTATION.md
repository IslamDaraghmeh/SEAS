# SEAS Mobile App Implementation Plan
## Flutter App for Exam Summaries & Grades

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Phase 1: Project Setup](#phase-1-project-setup)
5. [Phase 2: Authentication](#phase-2-authentication)
6. [Phase 3: Dashboard & Navigation](#phase-3-dashboard--navigation)
7. [Phase 4: Exams & Grades](#phase-4-exams--grades)
8. [Phase 5: Notifications & Settings](#phase-5-notifications--settings)
9. [Internationalization](#internationalization)
10. [UI/UX Guidelines](#uiux-guidelines)

---

## Overview

The SEAS mobile app provides students with:
- **Dashboard**: Overview of exams and grades
- **Exam Schedule**: View upcoming exams
- **Grades**: View exam results and course grades
- **Notifications**: Alerts for upcoming exams and results
- **Multi-language**: Arabic (default) and English support
- **Offline Support**: Cached data for offline viewing

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Flutter | 3.x |
| Language | Dart | 3.x |
| State Management | Riverpod | 2.x |
| Navigation | go_router | 12.x |
| API Client | Dio | 5.x |
| Local Storage | Hive | 2.x |
| Secure Storage | flutter_secure_storage | 9.x |
| i18n | flutter_localizations + intl | - |
| Charts | fl_chart | 0.65.x |
| Notifications | firebase_messaging | 14.x |
| UI Components | Custom + Material 3 | - |

---

## Architecture

### Clean Architecture

```
lib/
├── core/                      # Core functionality
│   ├── constants/
│   │   ├── app_colors.dart
│   │   ├── app_strings.dart
│   │   └── api_endpoints.dart
│   ├── errors/
│   │   ├── exceptions.dart
│   │   └── failures.dart
│   ├── network/
│   │   ├── dio_client.dart
│   │   └── network_info.dart
│   ├── theme/
│   │   ├── app_theme.dart
│   │   └── text_styles.dart
│   └── utils/
│       ├── date_utils.dart
│       └── validators.dart
│
├── data/                      # Data layer
│   ├── datasources/
│   │   ├── local/
│   │   │   ├── auth_local_datasource.dart
│   │   │   └── exams_local_datasource.dart
│   │   └── remote/
│   │       ├── auth_remote_datasource.dart
│   │       ├── exams_remote_datasource.dart
│   │       └── students_remote_datasource.dart
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── exam_model.dart
│   │   ├── grade_model.dart
│   │   └── course_model.dart
│   └── repositories/
│       ├── auth_repository_impl.dart
│       ├── exams_repository_impl.dart
│       └── students_repository_impl.dart
│
├── domain/                    # Domain layer
│   ├── entities/
│   │   ├── user.dart
│   │   ├── exam.dart
│   │   ├── grade.dart
│   │   └── course.dart
│   ├── repositories/
│   │   ├── auth_repository.dart
│   │   ├── exams_repository.dart
│   │   └── students_repository.dart
│   └── usecases/
│       ├── auth/
│       │   ├── login_usecase.dart
│       │   └── logout_usecase.dart
│       ├── exams/
│       │   ├── get_exams_usecase.dart
│       │   └── get_exam_details_usecase.dart
│       └── grades/
│           └── get_grades_usecase.dart
│
├── presentation/              # Presentation layer
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── exams_provider.dart
│   │   ├── grades_provider.dart
│   │   └── locale_provider.dart
│   ├── screens/
│   │   ├── splash/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── exams/
│   │   ├── grades/
│   │   └── settings/
│   └── widgets/
│       ├── common/
│       ├── exam/
│       └── grade/
│
├── l10n/                      # Localization
│   ├── app_ar.arb
│   └── app_en.arb
│
└── main.dart
```

---

## Phase 1: Project Setup

### Duration: Week 1

### Phase 1.1: Initialize Project
**Duration: 1 day**

#### Task 1.1.1: Create Flutter Project
```bash
flutter create --org com.seas --project-name seas_mobile seas_mobile
cd seas_mobile

# Add dependencies to pubspec.yaml
```

**File: `pubspec.yaml`**
```yaml
name: seas_mobile
description: SEAS - Smart Exam Attendance System Mobile App
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3

  # Navigation
  go_router: ^12.1.3

  # Network
  dio: ^5.4.0
  connectivity_plus: ^5.0.2

  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.0.0

  # UI
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  fl_chart: ^0.65.0
  percent_indicator: ^4.2.3

  # Utils
  intl: ^0.18.1
  equatable: ^2.0.5
  dartz: ^0.10.1
  freezed_annotation: ^2.4.1
  json_annotation: ^4.8.1

  # Notifications
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  build_runner: ^2.4.8
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  riverpod_generator: ^2.3.9
  hive_generator: ^2.0.1

flutter:
  uses-material-design: true
  generate: true

  assets:
    - assets/images/
    - assets/icons/

  fonts:
    - family: NotoSansArabic
      fonts:
        - asset: assets/fonts/NotoSansArabic-Regular.ttf
        - asset: assets/fonts/NotoSansArabic-Medium.ttf
          weight: 500
        - asset: assets/fonts/NotoSansArabic-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/NotoSansArabic-Bold.ttf
          weight: 700
```

#### Task 1.1.2: Configure Project Structure
Create the folder structure as shown in Architecture section.

**File: `lib/main.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/theme/app_theme.dart';
import 'presentation/providers/locale_provider.dart';
import 'l10n/app_localizations.dart';
import 'app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive
  await Hive.initFlutter();

  // Initialize Firebase
  // await Firebase.initializeApp();

  runApp(
    const ProviderScope(
      child: SEASApp(),
    ),
  );
}

class SEASApp extends ConsumerWidget {
  const SEASApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'SEAS',
      debugShowCheckedModeBanner: false,

      // Theme
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,

      // Localization
      locale: locale,
      supportedLocales: const [
        Locale('ar'), // Arabic (default)
        Locale('en'), // English
      ],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],

      // Router
      routerConfig: router,
    );
  }
}
```

**Deliverables:**
- [ ] Flutter project initialized
- [ ] Dependencies added
- [ ] Folder structure created
- [ ] Main app configured

---

### Phase 1.2: Core Setup
**Duration: 2 days**

#### Task 1.2.1: Create App Theme
**File: `lib/core/theme/app_theme.dart`**
```dart
import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'text_styles.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,

      // Colors
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
      ),

      // App Bar
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        titleTextStyle: TextStyle(
          fontFamily: 'NotoSansArabic',
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),

      // Cards
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border),
        ),
        color: Colors.white,
      ),

      // Inputs
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.inputBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),

      // Buttons
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontFamily: 'NotoSansArabic',
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Text
      textTheme: TextStyles.textTheme,
      fontFamily: 'NotoSansArabic',

      // Scaffold
      scaffoldBackgroundColor: AppColors.background,
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.dark,
      ),
      fontFamily: 'NotoSansArabic',
    );
  }
}
```

**File: `lib/core/theme/app_colors.dart`**
```dart
import 'package:flutter/material.dart';

class AppColors {
  // Primary
  static const Color primary = Color(0xFF2563EB);
  static const Color primaryLight = Color(0xFF3B82F6);
  static const Color primaryDark = Color(0xFF1D4ED8);

  // Semantic
  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Neutral
  static const Color background = Color(0xFFF9FAFB);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE5E7EB);
  static const Color inputBackground = Color(0xFFF3F4F6);

  // Text
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // Grades
  static const Color gradeA = Color(0xFF22C55E);
  static const Color gradeB = Color(0xFF84CC16);
  static const Color gradeC = Color(0xFFF59E0B);
  static const Color gradeD = Color(0xFFF97316);
  static const Color gradeF = Color(0xFFEF4444);
}
```

#### Task 1.2.2: Create Dio Client
**File: `lib/core/network/dio_client.dart`**
```dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/api_endpoints.dart';

final dioClientProvider = Provider<DioClient>((ref) {
  return DioClient();
});

class DioClient {
  late final Dio _dio;
  final _storage = const FlutterSecureStorage();

  DioClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.addAll([
      _AuthInterceptor(_storage),
      _LoggingInterceptor(),
    ]);
  }

  Dio get dio => _dio;

  // GET
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.get(path, queryParameters: queryParameters, options: options);
  }

  // POST
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.post(path, data: data, queryParameters: queryParameters, options: options);
  }

  // PUT
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.put(path, data: data, queryParameters: queryParameters, options: options);
  }

  // DELETE
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return _dio.delete(path, data: data, queryParameters: queryParameters, options: options);
  }
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;

  _AuthInterceptor(this._storage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Try to refresh token
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken != null) {
        try {
          final response = await Dio().post(
            '${ApiEndpoints.baseUrl}/auth/refresh',
            data: {'refreshToken': refreshToken},
          );

          final newAccessToken = response.data['accessToken'];
          await _storage.write(key: 'access_token', value: newAccessToken);

          // Retry original request
          err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
          final retryResponse = await Dio().fetch(err.requestOptions);
          handler.resolve(retryResponse);
          return;
        } catch (e) {
          // Refresh failed, logout
          await _storage.deleteAll();
        }
      }
    }
    handler.next(err);
  }
}

class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('REQUEST[${options.method}] => PATH: ${options.path}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    print('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    print('ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}');
    handler.next(err);
  }
}
```

**Deliverables:**
- [ ] App theme configured
- [ ] Color palette defined
- [ ] Dio client with interceptors
- [ ] Secure storage setup

---

## Phase 2: Authentication

### Duration: Week 2

### Phase 2.1: Auth Domain & Data Layer
**Duration: 2 days**

#### Task 2.1.1: Create User Entity
**File: `lib/domain/entities/user.dart`**
```dart
import 'package:equatable/equatable.dart';

enum UserRole { student, teacher, admin, proctor }

class User extends Equatable {
  final String id;
  final String email;
  final UserRole role;
  final Student? student;
  final Teacher? teacher;

  const User({
    required this.id,
    required this.email,
    required this.role,
    this.student,
    this.teacher,
  });

  @override
  List<Object?> get props => [id, email, role, student, teacher];
}

class Student extends Equatable {
  final String id;
  final String studentNumber;
  final String nameAr;
  final String nameEn;
  final DateTime? faceEnrolledAt;

  const Student({
    required this.id,
    required this.studentNumber,
    required this.nameAr,
    required this.nameEn,
    this.faceEnrolledAt,
  });

  String getName(String locale) => locale == 'ar' ? nameAr : nameEn;

  @override
  List<Object?> get props => [id, studentNumber, nameAr, nameEn, faceEnrolledAt];
}

class Teacher extends Equatable {
  final String id;
  final String nameAr;
  final String nameEn;
  final String? department;

  const Teacher({
    required this.id,
    required this.nameAr,
    required this.nameEn,
    this.department,
  });

  String getName(String locale) => locale == 'ar' ? nameAr : nameEn;

  @override
  List<Object?> get props => [id, nameAr, nameEn, department];
}
```

#### Task 2.1.2: Create Auth Repository
**File: `lib/domain/repositories/auth_repository.dart`**
```dart
import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/user.dart';

abstract class AuthRepository {
  Future<Either<Failure, User>> login(String email, String password);
  Future<Either<Failure, void>> logout();
  Future<Either<Failure, User?>> getCurrentUser();
  Future<bool> isLoggedIn();
}
```

**File: `lib/data/repositories/auth_repository_impl.dart`**
```dart
import 'package:dartz/dartz.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../core/errors/exceptions.dart';
import '../../core/errors/failures.dart';
import '../../core/network/network_info.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/local/auth_local_datasource.dart';
import '../datasources/remote/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final AuthLocalDataSource localDataSource;
  final NetworkInfo networkInfo;
  final FlutterSecureStorage secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
    required this.networkInfo,
    required this.secureStorage,
  });

  @override
  Future<Either<Failure, User>> login(String email, String password) async {
    if (!await networkInfo.isConnected) {
      return Left(NetworkFailure());
    }

    try {
      final result = await remoteDataSource.login(email, password);

      // Store tokens
      await secureStorage.write(key: 'access_token', value: result.accessToken);
      await secureStorage.write(key: 'refresh_token', value: result.refreshToken);

      // Cache user
      await localDataSource.cacheUser(result.user);

      return Right(result.user.toEntity());
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message));
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await remoteDataSource.logout();
      await secureStorage.deleteAll();
      await localDataSource.clearCache();
      return const Right(null);
    } catch (e) {
      // Still clear local data even if remote fails
      await secureStorage.deleteAll();
      await localDataSource.clearCache();
      return const Right(null);
    }
  }

  @override
  Future<Either<Failure, User?>> getCurrentUser() async {
    try {
      final cachedUser = await localDataSource.getCachedUser();
      if (cachedUser != null) {
        return Right(cachedUser.toEntity());
      }

      if (!await networkInfo.isConnected) {
        return const Right(null);
      }

      final user = await remoteDataSource.getCurrentUser();
      await localDataSource.cacheUser(user);
      return Right(user.toEntity());
    } catch (e) {
      return const Right(null);
    }
  }

  @override
  Future<bool> isLoggedIn() async {
    final token = await secureStorage.read(key: 'access_token');
    return token != null;
  }
}
```

**Deliverables:**
- [ ] User entity and models
- [ ] Auth repository interface
- [ ] Auth repository implementation
- [ ] Token management

---

### Phase 2.2: Auth UI
**Duration: 2 days**

#### Task 2.2.1: Create Auth Provider
**File: `lib/presentation/providers/auth_provider.dart`**
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../data/repositories/auth_repository_impl.dart';

part 'auth_provider.freezed.dart';

// Auth State
@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = _Initial;
  const factory AuthState.loading() = _Loading;
  const factory AuthState.authenticated(User user) = _Authenticated;
  const factory AuthState.unauthenticated() = _Unauthenticated;
  const factory AuthState.error(String message) = _Error;
}

// Auth Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(authRepositoryProvider));
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState.initial()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    state = const AuthState.loading();

    final isLoggedIn = await _repository.isLoggedIn();
    if (!isLoggedIn) {
      state = const AuthState.unauthenticated();
      return;
    }

    final result = await _repository.getCurrentUser();
    result.fold(
      (failure) => state = const AuthState.unauthenticated(),
      (user) => user != null
          ? state = AuthState.authenticated(user)
          : state = const AuthState.unauthenticated(),
    );
  }

  Future<void> login(String email, String password) async {
    state = const AuthState.loading();

    final result = await _repository.login(email, password);
    result.fold(
      (failure) => state = AuthState.error(failure.message),
      (user) => state = AuthState.authenticated(user),
    );
  }

  Future<void> logout() async {
    state = const AuthState.loading();
    await _repository.logout();
    state = const AuthState.unauthenticated();
  }
}
```

#### Task 2.2.2: Create Login Screen
**File: `lib/presentation/screens/auth/login_screen.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/custom_button.dart';
import '../../widgets/common/custom_text_field.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    await ref.read(authProvider.notifier).login(
          _emailController.text.trim(),
          _passwordController.text,
        );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final authState = ref.watch(authProvider);

    // Listen for auth state changes
    ref.listen<AuthState>(authProvider, (previous, next) {
      next.maybeWhen(
        authenticated: (_) => context.go('/dashboard'),
        error: (message) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: AppColors.error,
            ),
          );
        },
        orElse: () {},
      );
    });

    final isLoading = authState.maybeWhen(
      loading: () => true,
      orElse: () => false,
    );

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: Text(
                        'SEAS',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Title
                  Text(
                    l10n.loginTitle,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.loginSubtitle,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),

                  // Email Field
                  CustomTextField(
                    controller: _emailController,
                    label: l10n.email,
                    hint: l10n.emailHint,
                    keyboardType: TextInputType.emailAddress,
                    prefixIcon: Icons.email_outlined,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return l10n.emailRequired;
                      }
                      if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                          .hasMatch(value)) {
                        return l10n.emailInvalid;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Password Field
                  CustomTextField(
                    controller: _passwordController,
                    label: l10n.password,
                    hint: l10n.passwordHint,
                    obscureText: _obscurePassword,
                    prefixIcon: Icons.lock_outlined,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return l10n.passwordRequired;
                      }
                      if (value.length < 6) {
                        return l10n.passwordTooShort;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Login Button
                  CustomButton(
                    onPressed: isLoading ? null : _handleLogin,
                    isLoading: isLoading,
                    child: Text(l10n.login),
                  ),
                  const SizedBox(height: 16),

                  // Help Text
                  TextButton(
                    onPressed: () {
                      // Navigate to help/support
                    },
                    child: Text(l10n.needHelp),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
```

**Deliverables:**
- [ ] Auth provider with Riverpod
- [ ] Login screen UI
- [ ] Form validation
- [ ] Error handling

---

## Phase 3: Dashboard & Navigation

### Duration: Week 3

### Phase 3.1: Navigation Setup
**Duration: 1 day**

#### Task 3.1.1: Create App Router
**File: `lib/app_router.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'presentation/providers/auth_provider.dart';
import 'presentation/screens/splash/splash_screen.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/dashboard/dashboard_screen.dart';
import 'presentation/screens/exams/exams_screen.dart';
import 'presentation/screens/exams/exam_details_screen.dart';
import 'presentation/screens/grades/grades_screen.dart';
import 'presentation/screens/settings/settings_screen.dart';
import 'presentation/widgets/common/main_scaffold.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isLoggingIn = state.matchedLocation == '/login';
      final isSplash = state.matchedLocation == '/splash';

      return authState.maybeWhen(
        initial: () => '/splash',
        loading: () => isSplash ? null : '/splash',
        unauthenticated: () => isLoggingIn ? null : '/login',
        authenticated: (_) => isLoggingIn || isSplash ? '/dashboard' : null,
        error: (_) => isLoggingIn ? null : '/login',
        orElse: () => null,
      );
    },
    routes: [
      // Splash
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Main App with Bottom Navigation
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/exams',
            builder: (context, state) => const ExamsScreen(),
            routes: [
              GoRoute(
                path: ':examId',
                builder: (context, state) {
                  final examId = state.pathParameters['examId']!;
                  return ExamDetailsScreen(examId: examId);
                },
              ),
            ],
          ),
          GoRoute(
            path: '/grades',
            builder: (context, state) => const GradesScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
    ],
  );
});
```

#### Task 3.1.2: Create Main Scaffold with Bottom Navigation
**File: `lib/presentation/widgets/common/main_scaffold.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';

class MainScaffold extends StatelessWidget {
  final Widget child;

  const MainScaffold({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _calculateSelectedIndex(context),
        onDestinationSelected: (index) => _onItemTapped(index, context),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.dashboard_outlined),
            selectedIcon: const Icon(Icons.dashboard),
            label: l10n.dashboard,
          ),
          NavigationDestination(
            icon: const Icon(Icons.assignment_outlined),
            selectedIcon: const Icon(Icons.assignment),
            label: l10n.exams,
          ),
          NavigationDestination(
            icon: const Icon(Icons.grade_outlined),
            selectedIcon: const Icon(Icons.grade),
            label: l10n.grades,
          ),
          NavigationDestination(
            icon: const Icon(Icons.settings_outlined),
            selectedIcon: const Icon(Icons.settings),
            label: l10n.settings,
          ),
        ],
      ),
    );
  }

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/dashboard')) return 0;
    if (location.startsWith('/exams')) return 1;
    if (location.startsWith('/grades')) return 2;
    if (location.startsWith('/settings')) return 3;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/dashboard');
        break;
      case 1:
        context.go('/exams');
        break;
      case 2:
        context.go('/grades');
        break;
      case 3:
        context.go('/settings');
        break;
    }
  }
}
```

**Deliverables:**
- [ ] Go Router configuration
- [ ] Auth-based redirects
- [ ] Bottom navigation bar
- [ ] Shell route for main app

---

### Phase 3.2: Dashboard Screen
**Duration: 2 days**

#### Task 3.2.1: Create Dashboard Screen
**File: `lib/presentation/screens/dashboard/dashboard_screen.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../providers/auth_provider.dart';
import '../../providers/exams_provider.dart';
import '../../providers/grades_provider.dart';
import '../../widgets/common/stat_card.dart';
import '../../widgets/exam/exam_card.dart';
import '../../widgets/common/section_header.dart';
import '../../widgets/common/loading_shimmer.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context).languageCode;

    final authState = ref.watch(authProvider);
    final examsAsync = ref.watch(upcomingExamsProvider);
    final statsAsync = ref.watch(studentStatsProvider);

    final user = authState.maybeWhen(
      authenticated: (user) => user,
      orElse: () => null,
    );

    final studentName = user?.student?.getName(locale) ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.dashboard),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // Navigate to notifications
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(upcomingExamsProvider);
          ref.invalidate(studentStatsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              Text(
                l10n.welcomeBack(studentName),
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                l10n.dashboardSubtitle,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 24),

              // Stats Grid
              statsAsync.when(
                data: (stats) => _buildStatsGrid(context, l10n, stats),
                loading: () => const LoadingShimmer(height: 100),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),

              // Upcoming Exams
              SectionHeader(
                title: l10n.upcomingExams,
                onViewAll: () => context.go('/exams'),
              ),
              const SizedBox(height: 12),
              examsAsync.when(
                data: (exams) {
                  if (exams.isEmpty) {
                    return _buildEmptyState(context, l10n.noUpcomingExams);
                  }
                  return Column(
                    children: exams
                        .take(3)
                        .map((exam) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: ExamCard(
                                exam: exam,
                                onTap: () => context.go('/exams/${exam.id}'),
                              ),
                            ))
                        .toList(),
                  );
                },
                loading: () => const LoadingShimmer(height: 200),
                error: (error, _) => _buildErrorState(context, error.toString()),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsGrid(BuildContext context, AppLocalizations l10n, StudentStats stats) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        StatCard(
          title: l10n.totalExams,
          value: stats.totalExams.toString(),
          icon: Icons.assignment_outlined,
          color: AppColors.primary,
        ),
        StatCard(
          title: l10n.completedExams,
          value: stats.completedExams.toString(),
          icon: Icons.check_circle_outline,
          color: AppColors.success,
        ),
        StatCard(
          title: l10n.averageScore,
          value: '${stats.averageScore.toStringAsFixed(1)}%',
          icon: Icons.trending_up,
          color: AppColors.warning,
        ),
        StatCard(
          title: l10n.upcomingExams,
          value: stats.upcomingExams.toString(),
          icon: Icons.schedule,
          color: AppColors.info,
        ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context, String message) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppColors.inputBackground,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(
            Icons.event_available,
            size: 48,
            color: AppColors.textTertiary,
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              error,
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
```

**Deliverables:**
- [ ] Dashboard screen with stats
- [ ] Upcoming exams list
- [ ] Pull-to-refresh
- [ ] Loading states

---

## Phase 4: Exams & Grades

### Duration: Week 4-5

### Phase 4.1: Exams List & Details
**Duration: 3 days**

#### Task 4.1.1: Create Exams Screen
**File: `lib/presentation/screens/exams/exams_screen.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../providers/exams_provider.dart';
import '../../widgets/exam/exam_card.dart';
import '../../widgets/common/loading_shimmer.dart';

class ExamsScreen extends ConsumerStatefulWidget {
  const ExamsScreen({super.key});

  @override
  ConsumerState<ExamsScreen> createState() => _ExamsScreenState();
}

class _ExamsScreenState extends ConsumerState<ExamsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final examsAsync = ref.watch(allExamsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.exams),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: l10n.upcoming),
            Tab(text: l10n.completed),
            Tab(text: l10n.all),
          ],
        ),
      ),
      body: examsAsync.when(
        data: (exams) {
          final now = DateTime.now();
          final upcomingExams = exams
              .where((e) => e.startTime.isAfter(now))
              .toList()
            ..sort((a, b) => a.startTime.compareTo(b.startTime));

          final completedExams = exams
              .where((e) => e.attempt?.status == 'GRADED')
              .toList()
            ..sort((a, b) => b.startTime.compareTo(a.startTime));

          return TabBarView(
            controller: _tabController,
            children: [
              _buildExamsList(context, upcomingExams, l10n.noUpcomingExams),
              _buildExamsList(context, completedExams, l10n.noCompletedExams),
              _buildExamsList(context, exams, l10n.noExams),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(error.toString()),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(allExamsProvider),
                child: Text(l10n.retry),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExamsList(
    BuildContext context,
    List<Exam> exams,
    String emptyMessage,
  ) {
    if (exams.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.assignment_outlined,
              size: 64,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              emptyMessage,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(allExamsProvider);
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: exams.length,
        itemBuilder: (context, index) {
          final exam = exams[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ExamCard(
              exam: exam,
              showScore: exam.attempt?.status == 'GRADED',
              onTap: () => context.go('/exams/${exam.id}'),
            ),
          );
        },
      ),
    );
  }
}
```

#### Task 4.1.2: Create Exam Card Widget
**File: `lib/presentation/widgets/exam/exam_card.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_colors.dart';
import '../../../domain/entities/exam.dart';
import '../../../l10n/app_localizations.dart';

class ExamCard extends StatelessWidget {
  final Exam exam;
  final VoidCallback? onTap;
  final bool showScore;

  const ExamCard({
    super.key,
    required this.exam,
    this.onTap,
    this.showScore = false,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final locale = Localizations.localeOf(context).languageCode;
    final isRtl = locale == 'ar';

    final title = exam.getTitle(locale);
    final courseName = exam.course.getName(locale);
    final dateFormat = DateFormat('EEE, MMM d', locale);
    final timeFormat = DateFormat('h:mm a', locale);

    final now = DateTime.now();
    final isUpcoming = exam.startTime.isAfter(now);
    final isActive = exam.startTime.isBefore(now) && exam.endTime.isAfter(now);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          courseName,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusChip(context, l10n, isUpcoming, isActive),
                ],
              ),
              const SizedBox(height: 12),

              // Date & Time
              Row(
                children: [
                  const Icon(
                    Icons.calendar_today_outlined,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    dateFormat.format(exam.startTime),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(width: 16),
                  const Icon(
                    Icons.access_time,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    timeFormat.format(exam.startTime),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(width: 16),
                  const Icon(
                    Icons.timer_outlined,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    l10n.durationMinutes(exam.durationMinutes),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),

              // Score (if completed)
              if (showScore && exam.attempt != null) ...[
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      l10n.score,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                    Row(
                      children: [
                        Text(
                          '${exam.attempt!.score}/${exam.totalPoints}',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: _getScoreColor(exam.attempt!.percentage ?? 0),
                              ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: _getScoreColor(exam.attempt!.percentage ?? 0)
                                .withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${exam.attempt!.percentage?.toStringAsFixed(1)}%',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: _getScoreColor(exam.attempt!.percentage ?? 0),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(
    BuildContext context,
    AppLocalizations l10n,
    bool isUpcoming,
    bool isActive,
  ) {
    Color color;
    String text;

    if (isActive) {
      color = AppColors.success;
      text = l10n.active;
    } else if (isUpcoming) {
      color = AppColors.warning;
      text = l10n.upcoming;
    } else if (exam.attempt?.status == 'GRADED') {
      color = AppColors.primary;
      text = l10n.graded;
    } else {
      color = AppColors.textTertiary;
      text = l10n.ended;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }

  Color _getScoreColor(double percentage) {
    if (percentage >= 90) return AppColors.gradeA;
    if (percentage >= 80) return AppColors.gradeB;
    if (percentage >= 70) return AppColors.gradeC;
    if (percentage >= 60) return AppColors.gradeD;
    return AppColors.gradeF;
  }
}
```

**Deliverables:**
- [ ] Exams list with tabs
- [ ] Exam card widget
- [ ] Score display
- [ ] Pull-to-refresh

---

### Phase 4.2: Grades Screen
**Duration: 2 days**

#### Task 4.2.1: Create Grades Screen
**File: `lib/presentation/screens/grades/grades_screen.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../providers/grades_provider.dart';
import '../../widgets/grade/course_grade_card.dart';
import '../../widgets/common/loading_shimmer.dart';

class GradesScreen extends ConsumerWidget {
  const GradesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final gradesAsync = ref.watch(gradesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.grades),
      ),
      body: gradesAsync.when(
        data: (grades) {
          if (grades.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.grade_outlined,
                    size: 64,
                    color: AppColors.textTertiary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.noGrades,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            );
          }

          // Calculate overall statistics
          final totalPoints = grades.fold<int>(
            0,
            (sum, g) => sum + g.totalPoints,
          );
          final earnedPoints = grades.fold<int>(
            0,
            (sum, g) => sum + g.totalScore,
          );
          final overallPercentage = totalPoints > 0
              ? (earnedPoints / totalPoints * 100)
              : 0.0;

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(gradesProvider);
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Overall Grade Card
                  _buildOverallCard(
                    context,
                    l10n,
                    overallPercentage,
                    earnedPoints,
                    totalPoints,
                  ),
                  const SizedBox(height: 24),

                  // Performance Chart
                  _buildPerformanceChart(context, l10n, grades),
                  const SizedBox(height: 24),

                  // Course Grades
                  Text(
                    l10n.courseGrades,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  ...grades.map((grade) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: CourseGradeCard(grade: grade),
                      )),
                ],
              ),
            ),
          );
        },
        loading: () => const Padding(
          padding: EdgeInsets.all(16),
          child: LoadingShimmer(height: 400),
        ),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 16),
              Text(error.toString()),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(gradesProvider),
                child: Text(l10n.retry),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOverallCard(
    BuildContext context,
    AppLocalizations l10n,
    double percentage,
    int earned,
    int total,
  ) {
    final grade = _getLetterGrade(percentage);
    final color = _getGradeColor(percentage);

    return Card(
      color: color.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Row(
          children: [
            // Grade Circle
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  grade,
                  style: const TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.overallGrade,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${percentage.toStringAsFixed(1)}%',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$earned / $total ${l10n.points}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerformanceChart(
    BuildContext context,
    AppLocalizations l10n,
    List<CourseGrade> grades,
  ) {
    final locale = Localizations.localeOf(context).languageCode;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.performanceOverview,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: 100,
                  barTouchData: BarTouchData(
                    enabled: true,
                    touchTooltipData: BarTouchTooltipData(
                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                        return BarTooltipItem(
                          '${rod.toY.toStringAsFixed(1)}%',
                          const TextStyle(color: Colors.white),
                        );
                      },
                    ),
                  ),
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          if (value.toInt() >= grades.length) {
                            return const SizedBox.shrink();
                          }
                          final course = grades[value.toInt()].course;
                          return Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              course.code,
                              style: const TextStyle(
                                fontSize: 10,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '${value.toInt()}%',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.textSecondary,
                            ),
                          );
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: grades.asMap().entries.map((entry) {
                    final percentage = entry.value.totalPoints > 0
                        ? (entry.value.totalScore / entry.value.totalPoints * 100)
                        : 0.0;
                    return BarChartGroupData(
                      x: entry.key,
                      barRods: [
                        BarChartRodData(
                          toY: percentage,
                          color: _getGradeColor(percentage),
                          width: 24,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(4),
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getLetterGrade(double percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  Color _getGradeColor(double percentage) {
    if (percentage >= 90) return AppColors.gradeA;
    if (percentage >= 80) return AppColors.gradeB;
    if (percentage >= 70) return AppColors.gradeC;
    if (percentage >= 60) return AppColors.gradeD;
    return AppColors.gradeF;
  }
}
```

**Deliverables:**
- [ ] Grades screen with overall statistics
- [ ] Performance chart
- [ ] Course grade cards
- [ ] Letter grade calculation

---

## Phase 5: Notifications & Settings

### Duration: Week 6

### Phase 5.1: Settings Screen
**Duration: 2 days**

#### Task 5.1.1: Create Settings Screen
**File: `lib/presentation/screens/settings/settings_screen.dart`**
```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../providers/auth_provider.dart';
import '../../providers/locale_provider.dart';
import '../../widgets/common/settings_tile.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = ref.watch(localeProvider);
    final authState = ref.watch(authProvider);

    final user = authState.maybeWhen(
      authenticated: (user) => user,
      orElse: () => null,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.settings),
      ),
      body: ListView(
        children: [
          // Profile Section
          if (user != null) ...[
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundColor: AppColors.primary.withOpacity(0.1),
                    child: Text(
                      user.student?.nameEn[0].toUpperCase() ?? 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.student?.getName(currentLocale.languageCode) ??
                              user.email,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          user.student?.studentNumber ?? '',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(),
          ],

          // Language Section
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              l10n.language,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          SettingsTile(
            icon: Icons.language,
            title: l10n.appLanguage,
            subtitle: currentLocale.languageCode == 'ar' ? 'العربية' : 'English',
            onTap: () => _showLanguageDialog(context, ref),
          ),
          const Divider(),

          // Notifications Section
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              l10n.notifications,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          SettingsTile(
            icon: Icons.notifications_outlined,
            title: l10n.pushNotifications,
            trailing: Switch(
              value: true, // TODO: Bind to actual state
              onChanged: (value) {
                // TODO: Toggle notifications
              },
            ),
          ),
          const Divider(),

          // About Section
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              l10n.about,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          SettingsTile(
            icon: Icons.info_outline,
            title: l10n.appVersion,
            subtitle: '1.0.0',
          ),
          SettingsTile(
            icon: Icons.description_outlined,
            title: l10n.termsOfService,
            onTap: () {
              // Navigate to terms
            },
          ),
          SettingsTile(
            icon: Icons.privacy_tip_outlined,
            title: l10n.privacyPolicy,
            onTap: () {
              // Navigate to privacy
            },
          ),
          const Divider(),

          // Logout
          SettingsTile(
            icon: Icons.logout,
            title: l10n.logout,
            iconColor: AppColors.error,
            titleColor: AppColors.error,
            onTap: () => _showLogoutDialog(context, ref, l10n),
          ),
        ],
      ),
    );
  }

  void _showLanguageDialog(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = ref.read(localeProvider);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.selectLanguage),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('العربية'),
              leading: Radio<String>(
                value: 'ar',
                groupValue: currentLocale.languageCode,
                onChanged: (value) {
                  ref.read(localeProvider.notifier).setLocale(const Locale('ar'));
                  Navigator.pop(context);
                },
              ),
              onTap: () {
                ref.read(localeProvider.notifier).setLocale(const Locale('ar'));
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text('English'),
              leading: Radio<String>(
                value: 'en',
                groupValue: currentLocale.languageCode,
                onChanged: (value) {
                  ref.read(localeProvider.notifier).setLocale(const Locale('en'));
                  Navigator.pop(context);
                },
              ),
              onTap: () {
                ref.read(localeProvider.notifier).setLocale(const Locale('en'));
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(
    BuildContext context,
    WidgetRef ref,
    AppLocalizations l10n,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.logout),
        content: Text(l10n.logoutConfirmation),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(authProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: Text(l10n.logout),
          ),
        ],
      ),
    );
  }
}
```

**Deliverables:**
- [ ] Settings screen with sections
- [ ] Language switcher
- [ ] Logout confirmation
- [ ] Profile display

---

## Internationalization

### ARB Files

**File: `lib/l10n/app_ar.arb`**
```json
{
  "@@locale": "ar",
  "appName": "نظام الحضور الذكي للامتحانات",
  "login": "تسجيل الدخول",
  "loginTitle": "مرحباً بك",
  "loginSubtitle": "سجّل الدخول للمتابعة",
  "email": "البريد الإلكتروني",
  "emailHint": "أدخل بريدك الإلكتروني",
  "emailRequired": "البريد الإلكتروني مطلوب",
  "emailInvalid": "البريد الإلكتروني غير صالح",
  "password": "كلمة المرور",
  "passwordHint": "أدخل كلمة المرور",
  "passwordRequired": "كلمة المرور مطلوبة",
  "passwordTooShort": "كلمة المرور قصيرة جداً",
  "needHelp": "تحتاج مساعدة؟",
  "dashboard": "الرئيسية",
  "exams": "الامتحانات",
  "grades": "الدرجات",
  "settings": "الإعدادات",
  "welcomeBack": "مرحباً، {name}",
  "@welcomeBack": {
    "placeholders": {
      "name": {}
    }
  },
  "dashboardSubtitle": "إليك نظرة عامة على امتحاناتك",
  "totalExams": "إجمالي الامتحانات",
  "completedExams": "الامتحانات المكتملة",
  "averageScore": "متوسط الدرجات",
  "upcomingExams": "الامتحانات القادمة",
  "upcoming": "قادمة",
  "completed": "مكتملة",
  "all": "الكل",
  "noUpcomingExams": "لا توجد امتحانات قادمة",
  "noCompletedExams": "لا توجد امتحانات مكتملة",
  "noExams": "لا توجد امتحانات",
  "noGrades": "لا توجد درجات بعد",
  "active": "نشط",
  "graded": "مُقيَّم",
  "ended": "انتهى",
  "score": "الدرجة",
  "durationMinutes": "{count} دقيقة",
  "@durationMinutes": {
    "placeholders": {
      "count": {}
    }
  },
  "overallGrade": "الدرجة الكلية",
  "points": "نقطة",
  "courseGrades": "درجات المقررات",
  "performanceOverview": "نظرة عامة على الأداء",
  "language": "اللغة",
  "appLanguage": "لغة التطبيق",
  "selectLanguage": "اختر اللغة",
  "notifications": "الإشعارات",
  "pushNotifications": "إشعارات الدفع",
  "about": "حول التطبيق",
  "appVersion": "إصدار التطبيق",
  "termsOfService": "شروط الخدمة",
  "privacyPolicy": "سياسة الخصوصية",
  "logout": "تسجيل الخروج",
  "logoutConfirmation": "هل أنت متأكد من تسجيل الخروج؟",
  "cancel": "إلغاء",
  "retry": "إعادة المحاولة"
}
```

**File: `lib/l10n/app_en.arb`**
```json
{
  "@@locale": "en",
  "appName": "Smart Exam Attendance System",
  "login": "Login",
  "loginTitle": "Welcome Back",
  "loginSubtitle": "Sign in to continue",
  "email": "Email",
  "emailHint": "Enter your email",
  "emailRequired": "Email is required",
  "emailInvalid": "Invalid email address",
  "password": "Password",
  "passwordHint": "Enter your password",
  "passwordRequired": "Password is required",
  "passwordTooShort": "Password is too short",
  "needHelp": "Need help?",
  "dashboard": "Dashboard",
  "exams": "Exams",
  "grades": "Grades",
  "settings": "Settings",
  "welcomeBack": "Welcome, {name}",
  "dashboardSubtitle": "Here's an overview of your exams",
  "totalExams": "Total Exams",
  "completedExams": "Completed",
  "averageScore": "Average Score",
  "upcomingExams": "Upcoming",
  "upcoming": "Upcoming",
  "completed": "Completed",
  "all": "All",
  "noUpcomingExams": "No upcoming exams",
  "noCompletedExams": "No completed exams",
  "noExams": "No exams",
  "noGrades": "No grades yet",
  "active": "Active",
  "graded": "Graded",
  "ended": "Ended",
  "score": "Score",
  "durationMinutes": "{count} min",
  "overallGrade": "Overall Grade",
  "points": "points",
  "courseGrades": "Course Grades",
  "performanceOverview": "Performance Overview",
  "language": "Language",
  "appLanguage": "App Language",
  "selectLanguage": "Select Language",
  "notifications": "Notifications",
  "pushNotifications": "Push Notifications",
  "about": "About",
  "appVersion": "App Version",
  "termsOfService": "Terms of Service",
  "privacyPolicy": "Privacy Policy",
  "logout": "Logout",
  "logoutConfirmation": "Are you sure you want to logout?",
  "cancel": "Cancel",
  "retry": "Retry"
}
```

---

## Task Summary

### Phase 1: Project Setup (Week 1)
| Task | Status | Duration |
|------|--------|----------|
| 1.1.1 Create Flutter Project | [ ] | 0.5 day |
| 1.1.2 Configure Project Structure | [ ] | 0.5 day |
| 1.2.1 Create App Theme | [ ] | 1 day |
| 1.2.2 Create Dio Client | [ ] | 1 day |

### Phase 2: Authentication (Week 2)
| Task | Status | Duration |
|------|--------|----------|
| 2.1.1 Create User Entity | [ ] | 1 day |
| 2.1.2 Create Auth Repository | [ ] | 1 day |
| 2.2.1 Create Auth Provider | [ ] | 1 day |
| 2.2.2 Create Login Screen | [ ] | 1 day |

### Phase 3: Dashboard & Navigation (Week 3)
| Task | Status | Duration |
|------|--------|----------|
| 3.1.1 Create App Router | [ ] | 0.5 day |
| 3.1.2 Create Main Scaffold | [ ] | 0.5 day |
| 3.2.1 Create Dashboard Screen | [ ] | 2 days |

### Phase 4: Exams & Grades (Week 4-5)
| Task | Status | Duration |
|------|--------|----------|
| 4.1.1 Create Exams Screen | [ ] | 1.5 days |
| 4.1.2 Create Exam Card Widget | [ ] | 1 day |
| 4.1.3 Create Exam Details Screen | [ ] | 1 day |
| 4.2.1 Create Grades Screen | [ ] | 2 days |

### Phase 5: Notifications & Settings (Week 6)
| Task | Status | Duration |
|------|--------|----------|
| 5.1.1 Create Settings Screen | [ ] | 1.5 days |
| 5.1.2 Implement Language Switch | [ ] | 0.5 day |
| 5.2.1 Setup Push Notifications | [ ] | 2 days |
