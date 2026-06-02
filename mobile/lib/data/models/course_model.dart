import 'package:equatable/equatable.dart';

/// Course Model for SEAS Mobile App
class CourseModel extends Equatable {
  final String id;
  final String code;
  final String name;
  final String? nameAr;
  final String? description;
  final String? descriptionAr;
  final int creditHours;
  final String? department;
  final String? departmentAr;
  final String? instructorName;
  final String? instructorNameAr;
  final String? semester;
  final String? academicYear;
  final int? level;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const CourseModel({
    required this.id,
    required this.code,
    required this.name,
    this.nameAr,
    this.description,
    this.descriptionAr,
    this.creditHours = 3,
    this.department,
    this.departmentAr,
    this.instructorName,
    this.instructorNameAr,
    this.semester,
    this.academicYear,
    this.level,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  factory CourseModel.fromJson(Map<String, dynamic> json) {
    return CourseModel(
      id: json['id']?.toString() ?? '',
      code: json['code'] ?? json['course_code'] ?? '',
      name: json['name'] ?? json['course_name'] ?? '',
      nameAr: json['name_ar'] ?? json['course_name_ar'],
      description: json['description'],
      descriptionAr: json['description_ar'],
      creditHours: json['credit_hours'] ?? json['creditHours'] ?? 3,
      department: json['department'],
      departmentAr: json['department_ar'],
      instructorName: json['instructor_name'] ?? json['instructorName'],
      instructorNameAr: json['instructor_name_ar'] ?? json['instructorNameAr'],
      semester: json['semester'],
      academicYear: json['academic_year'] ?? json['academicYear'],
      level: json['level'],
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
      'code': code,
      'name': name,
      'name_ar': nameAr,
      'description': description,
      'description_ar': descriptionAr,
      'credit_hours': creditHours,
      'department': department,
      'department_ar': departmentAr,
      'instructor_name': instructorName,
      'instructor_name_ar': instructorNameAr,
      'semester': semester,
      'academic_year': academicYear,
      'level': level,
      'is_active': isActive,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  CourseModel copyWith({
    String? id,
    String? code,
    String? name,
    String? nameAr,
    String? description,
    String? descriptionAr,
    int? creditHours,
    String? department,
    String? departmentAr,
    String? instructorName,
    String? instructorNameAr,
    String? semester,
    String? academicYear,
    int? level,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CourseModel(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      nameAr: nameAr ?? this.nameAr,
      description: description ?? this.description,
      descriptionAr: descriptionAr ?? this.descriptionAr,
      creditHours: creditHours ?? this.creditHours,
      department: department ?? this.department,
      departmentAr: departmentAr ?? this.departmentAr,
      instructorName: instructorName ?? this.instructorName,
      instructorNameAr: instructorNameAr ?? this.instructorNameAr,
      semester: semester ?? this.semester,
      academicYear: academicYear ?? this.academicYear,
      level: level ?? this.level,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Get name based on locale
  String getName(String locale) {
    if (locale == 'ar' && nameAr != null && nameAr!.isNotEmpty) {
      return nameAr!;
    }
    return name;
  }

  /// Get description based on locale
  String? getDescription(String locale) {
    if (locale == 'ar' && descriptionAr != null && descriptionAr!.isNotEmpty) {
      return descriptionAr;
    }
    return description;
  }

  /// Get department name based on locale
  String? getDepartmentName(String locale) {
    if (locale == 'ar' && departmentAr != null && departmentAr!.isNotEmpty) {
      return departmentAr;
    }
    return department;
  }

  /// Get instructor name based on locale
  String? getInstructorName(String locale) {
    if (locale == 'ar' &&
        instructorNameAr != null &&
        instructorNameAr!.isNotEmpty) {
      return instructorNameAr;
    }
    return instructorName;
  }

  /// Get full display name with code
  String getFullName(String locale) {
    return '$code - ${getName(locale)}';
  }

  @override
  List<Object?> get props => [
        id,
        code,
        name,
        nameAr,
        description,
        descriptionAr,
        creditHours,
        department,
        departmentAr,
        instructorName,
        instructorNameAr,
        semester,
        academicYear,
        level,
        isActive,
        createdAt,
        updatedAt,
      ];
}

/// Course with grades summary
class CourseWithGrade extends CourseModel {
  final double? grade;
  final double? maxGrade;
  final String? letterGrade;

  const CourseWithGrade({
    required super.id,
    required super.code,
    required super.name,
    super.nameAr,
    super.description,
    super.descriptionAr,
    super.creditHours,
    super.department,
    super.departmentAr,
    super.instructorName,
    super.instructorNameAr,
    super.semester,
    super.academicYear,
    super.level,
    super.isActive,
    super.createdAt,
    super.updatedAt,
    this.grade,
    this.maxGrade,
    this.letterGrade,
  });

  factory CourseWithGrade.fromJson(Map<String, dynamic> json) {
    return CourseWithGrade(
      id: json['id']?.toString() ?? '',
      code: json['code'] ?? json['course_code'] ?? '',
      name: json['name'] ?? json['course_name'] ?? '',
      nameAr: json['name_ar'] ?? json['course_name_ar'],
      description: json['description'],
      descriptionAr: json['description_ar'],
      creditHours: json['credit_hours'] ?? json['creditHours'] ?? 3,
      department: json['department'],
      departmentAr: json['department_ar'],
      instructorName: json['instructor_name'] ?? json['instructorName'],
      instructorNameAr: json['instructor_name_ar'] ?? json['instructorNameAr'],
      semester: json['semester'],
      academicYear: json['academic_year'] ?? json['academicYear'],
      level: json['level'],
      isActive: json['is_active'] ?? json['isActive'] ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
      grade: json['grade']?.toDouble(),
      maxGrade: json['max_grade']?.toDouble(),
      letterGrade: json['letter_grade'] ?? json['letterGrade'],
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json['grade'] = grade;
    json['max_grade'] = maxGrade;
    json['letter_grade'] = letterGrade;
    return json;
  }

  double get percentage {
    if (grade == null || maxGrade == null || maxGrade == 0) return 0;
    return (grade! / maxGrade!) * 100;
  }
}
