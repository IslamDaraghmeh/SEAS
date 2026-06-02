import 'package:flutter/material.dart';

/// App Color Scheme for SEAS Mobile App
class AppColors {
  AppColors._();

  // Primary Colors
  static const Color primary = Color(0xFF1E88E5);
  static const Color primaryLight = Color(0xFF6AB7FF);
  static const Color primaryDark = Color(0xFF005CB2);

  // Secondary Colors
  static const Color secondary = Color(0xFF26A69A);
  static const Color secondaryLight = Color(0xFF64D8CB);
  static const Color secondaryDark = Color(0xFF00766C);

  // Accent Colors
  static const Color accent = Color(0xFFFF7043);
  static const Color accentLight = Color(0xFFFFA270);
  static const Color accentDark = Color(0xFFC63F17);

  // Background Colors
  static const Color backgroundLight = Color(0xFFF5F5F5);
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1E1E1E);

  // Card Colors
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color cardDark = Color(0xFF2C2C2C);

  // Text Colors
  static const Color textPrimaryLight = Color(0xFF212121);
  static const Color textSecondaryLight = Color(0xFF757575);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFFB0B0B0);

  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color successLight = Color(0xFF80E27E);
  static const Color successDark = Color(0xFF087F23);

  static const Color warning = Color(0xFFFF9800);
  static const Color warningLight = Color(0xFFFFB74D);
  static const Color warningDark = Color(0xFFF57C00);

  static const Color error = Color(0xFFE53935);
  static const Color errorLight = Color(0xFFFF6F60);
  static const Color errorDark = Color(0xFFAB000D);

  static const Color info = Color(0xFF2196F3);
  static const Color infoLight = Color(0xFF64B5F6);
  static const Color infoDark = Color(0xFF1976D2);

  // Grade Colors
  static const Color gradeA = Color(0xFF4CAF50);
  static const Color gradeB = Color(0xFF8BC34A);
  static const Color gradeC = Color(0xFFFFEB3B);
  static const Color gradeD = Color(0xFFFF9800);
  static const Color gradeF = Color(0xFFE53935);

  // Exam Status Colors
  static const Color examUpcoming = Color(0xFF2196F3);
  static const Color examOngoing = Color(0xFFFF9800);
  static const Color examCompleted = Color(0xFF4CAF50);
  static const Color examCancelled = Color(0xFF9E9E9E);

  // Shimmer Colors
  static const Color shimmerBase = Color(0xFFE0E0E0);
  static const Color shimmerHighlight = Color(0xFFF5F5F5);
  static const Color shimmerBaseDark = Color(0xFF424242);
  static const Color shimmerHighlightDark = Color(0xFF616161);

  // Divider
  static const Color dividerLight = Color(0xFFE0E0E0);
  static const Color dividerDark = Color(0xFF424242);

  // Overlay
  static const Color overlay = Color(0x80000000);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryDark],
  );

  static const LinearGradient secondaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [secondary, secondaryDark],
  );

  // Get color based on grade percentage
  static Color getGradeColor(double percentage) {
    if (percentage >= 90) return gradeA;
    if (percentage >= 80) return gradeB;
    if (percentage >= 70) return gradeC;
    if (percentage >= 60) return gradeD;
    return gradeF;
  }

  // Get color based on exam status
  static Color getExamStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'upcoming':
      case 'scheduled':
        return examUpcoming;
      case 'ongoing':
      case 'in_progress':
        return examOngoing;
      case 'completed':
      case 'finished':
        return examCompleted;
      case 'cancelled':
      case 'canceled':
        return examCancelled;
      default:
        return info;
    }
  }
}
