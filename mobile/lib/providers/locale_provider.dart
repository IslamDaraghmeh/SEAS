import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/constants/app_strings.dart';
import '../core/localization/app_localizations.dart';

/// Locale Notifier
class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(AppLocalizations.defaultLocale) {
    _loadSavedLocale();
  }

  /// Load saved locale from preferences
  Future<void> _loadSavedLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final localeCode = prefs.getString(AppStrings.localeKey);
      if (localeCode != null) {
        state = Locale(localeCode);
      }
    } catch (e) {
      // Use default locale if error
    }
  }

  /// Set locale
  Future<void> setLocale(Locale locale) async {
    state = locale;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppStrings.localeKey, locale.languageCode);
    } catch (e) {
      // Ignore save errors
    }
  }

  /// Toggle between Arabic and English
  Future<void> toggleLocale() async {
    final newLocale =
        state.languageCode == 'ar' ? const Locale('en') : const Locale('ar');
    await setLocale(newLocale);
  }

  /// Check if current locale is Arabic
  bool get isArabic => state.languageCode == 'ar';

  /// Check if current locale is English
  bool get isEnglish => state.languageCode == 'en';

  /// Get text direction
  TextDirection get textDirection =>
      isArabic ? TextDirection.rtl : TextDirection.ltr;
}

/// Locale Provider
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

/// Is Arabic Provider
final isArabicProvider = Provider<bool>((ref) {
  return ref.watch(localeProvider).languageCode == 'ar';
});

/// Is RTL Provider
final isRtlProvider = Provider<bool>((ref) {
  return ref.watch(localeProvider).languageCode == 'ar';
});

/// Text Direction Provider
final textDirectionProvider = Provider<TextDirection>((ref) {
  return ref.watch(isRtlProvider) ? TextDirection.rtl : TextDirection.ltr;
});

/// Language Name Provider
final languageNameProvider = Provider<String>((ref) {
  final locale = ref.watch(localeProvider);
  switch (locale.languageCode) {
    case 'ar':
      return 'العربية';
    case 'en':
      return 'English';
    default:
      return 'العربية';
  }
});

/// Supported Locales Provider
final supportedLocalesProvider = Provider<List<LocaleInfo>>((ref) {
  return [
    const LocaleInfo(
      locale: Locale('ar'),
      name: 'العربية',
      englishName: 'Arabic',
      flag: '🇸🇦',
    ),
    const LocaleInfo(
      locale: Locale('en'),
      name: 'English',
      englishName: 'English',
      flag: '🇺🇸',
    ),
  ];
});

/// Locale Info Class
class LocaleInfo {
  final Locale locale;
  final String name;
  final String englishName;
  final String flag;

  const LocaleInfo({
    required this.locale,
    required this.name,
    required this.englishName,
    required this.flag,
  });

  String get languageCode => locale.languageCode;

  String getDisplayName(String currentLocale) {
    return currentLocale == 'ar' ? name : englishName;
  }
}

/// Current Locale Info Provider
final currentLocaleInfoProvider = Provider<LocaleInfo>((ref) {
  final locale = ref.watch(localeProvider);
  final supportedLocales = ref.watch(supportedLocalesProvider);

  return supportedLocales.firstWhere(
    (info) => info.locale.languageCode == locale.languageCode,
    orElse: () => supportedLocales.first,
  );
});
