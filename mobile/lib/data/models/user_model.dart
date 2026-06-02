import 'package:equatable/equatable.dart';

/// User Model for SEAS Mobile App
class UserModel extends Equatable {
  final String id;
  final String email;
  final String fullName;
  final String? fullNameAr;
  final String studentId;
  final String? phone;
  final String? avatar;
  final String? department;
  final String? departmentAr;
  final int? level;
  final String? academicYear;
  final bool isEmailVerified;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.fullNameAr,
    required this.studentId,
    this.phone,
    this.avatar,
    this.department,
    this.departmentAr,
    this.level,
    this.academicYear,
    this.isEmailVerified = false,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? json['fullName'] ?? '',
      fullNameAr: json['full_name_ar'] ?? json['fullNameAr'],
      studentId: json['student_id']?.toString() ?? json['studentId']?.toString() ?? '',
      phone: json['phone'],
      avatar: json['avatar'] ?? json['avatar_url'],
      department: json['department'],
      departmentAr: json['department_ar'] ?? json['departmentAr'],
      level: json['level'],
      academicYear: json['academic_year'] ?? json['academicYear'],
      isEmailVerified: json['is_email_verified'] ?? json['isEmailVerified'] ?? false,
      isActive: json['is_active'] ?? json['isActive'] ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'full_name_ar': fullNameAr,
      'student_id': studentId,
      'phone': phone,
      'avatar': avatar,
      'department': department,
      'department_ar': departmentAr,
      'level': level,
      'academic_year': academicYear,
      'is_email_verified': isEmailVerified,
      'is_active': isActive,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? fullName,
    String? fullNameAr,
    String? studentId,
    String? phone,
    String? avatar,
    String? department,
    String? departmentAr,
    int? level,
    String? academicYear,
    bool? isEmailVerified,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      fullNameAr: fullNameAr ?? this.fullNameAr,
      studentId: studentId ?? this.studentId,
      phone: phone ?? this.phone,
      avatar: avatar ?? this.avatar,
      department: department ?? this.department,
      departmentAr: departmentAr ?? this.departmentAr,
      level: level ?? this.level,
      academicYear: academicYear ?? this.academicYear,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Get display name based on locale
  String getDisplayName(String locale) {
    if (locale == 'ar' && fullNameAr != null && fullNameAr!.isNotEmpty) {
      return fullNameAr!;
    }
    return fullName;
  }

  /// Get department name based on locale
  String? getDepartmentName(String locale) {
    if (locale == 'ar' && departmentAr != null && departmentAr!.isNotEmpty) {
      return departmentAr;
    }
    return department;
  }

  /// Get initials for avatar
  String get initials {
    final names = fullName.split(' ');
    if (names.length >= 2) {
      return '${names[0][0]}${names[1][0]}'.toUpperCase();
    }
    return fullName.isNotEmpty ? fullName[0].toUpperCase() : 'U';
  }

  @override
  List<Object?> get props => [
        id,
        email,
        fullName,
        fullNameAr,
        studentId,
        phone,
        avatar,
        department,
        departmentAr,
        level,
        academicYear,
        isEmailVerified,
        isActive,
        createdAt,
        updatedAt,
      ];
}

/// Login Request Model
class LoginRequest {
  final String email;
  final String password;

  const LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }
}

/// Register Request Model
class RegisterRequest {
  final String email;
  final String password;
  final String fullName;
  final String studentId;
  final String? phone;

  const RegisterRequest({
    required this.email,
    required this.password,
    required this.fullName,
    required this.studentId,
    this.phone,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
      'full_name': fullName,
      'student_id': studentId,
      if (phone != null) 'phone': phone,
    };
  }
}

/// Auth Response Model
class AuthResponse {
  final String accessToken;
  final String? refreshToken;
  final String tokenType;
  final int? expiresIn;
  final UserModel user;

  const AuthResponse({
    required this.accessToken,
    this.refreshToken,
    this.tokenType = 'Bearer',
    this.expiresIn,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['access_token'] ?? json['accessToken'] ?? '',
      refreshToken: json['refresh_token'] ?? json['refreshToken'],
      tokenType: json['token_type'] ?? json['tokenType'] ?? 'Bearer',
      expiresIn: json['expires_in'] ?? json['expiresIn'],
      user: UserModel.fromJson(json['user'] ?? {}),
    );
  }
}
