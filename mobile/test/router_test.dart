// Regression test for the "stuck on blue splash screen" bug.
//
// Root cause: `appRouterProvider` used `ref.watch(authStateProvider)`, so every
// auth-state change rebuilt the provider and constructed a NEW GoRouter. A new
// GoRouter resets the Navigator to `initialLocation: '/'` (the splash), and the
// splash itself changes auth state on startup — producing an infinite
// remount loop that never navigated away from the splash.
//
// The fix builds the GoRouter once and reacts to auth changes via
// `refreshListenable`. This test locks that in: the router instance must be
// STABLE across auth-state changes.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:seas_mobile/core/network/dio_client.dart';
import 'package:seas_mobile/core/router/app_router.dart';
import 'package:seas_mobile/data/models/user_model.dart';
import 'package:seas_mobile/data/repositories/auth_repository.dart';
import 'package:seas_mobile/providers/auth_provider.dart';

class _NoopAuthRepo extends AuthRepository {
  _NoopAuthRepo() : super(DioClient(appSecureStorage), appSecureStorage);
}

/// Auth notifier we can drive directly, without touching the network/storage.
class _AuthCtl extends AuthNotifier {
  _AuthCtl() : super(_NoopAuthRepo());
  @override
  Future<void> initialize() async {}
  void setAuthed(UserModel u) => state = AuthState.authenticated(u);
  void setUnauthed() => state = AuthState.unauthenticated();
}

const _user = UserModel(
  id: 'u1',
  email: 'student1@aaup.edu',
  fullName: 'Student One',
  studentId: '20200001',
);

void main() {
  test('appRouterProvider builds the GoRouter once and is stable across auth changes', () {
    final container = ProviderContainer(
      overrides: [authStateProvider.overrideWith((ref) => _AuthCtl())],
    );
    addTearDown(container.dispose);

    final GoRouter r1 = container.read(appRouterProvider);
    final ctl = container.read(authStateProvider.notifier) as _AuthCtl;

    // Simulate the splash startup transitions that previously thrashed the router.
    ctl.setAuthed(_user);
    final GoRouter r2 = container.read(appRouterProvider);

    ctl.setUnauthed();
    final GoRouter r3 = container.read(appRouterProvider);

    // Same instance every time => the Navigator is never reset out from under us.
    expect(identical(r1, r2), isTrue,
        reason: 'GoRouter was recreated on auth change — splash loop regression');
    expect(identical(r1, r3), isTrue,
        reason: 'GoRouter was recreated on auth change — splash loop regression');
  });
}
